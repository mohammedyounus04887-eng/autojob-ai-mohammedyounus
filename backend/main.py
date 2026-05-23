from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from io import BytesIO
from email.message import EmailMessage
from dotenv import load_dotenv
from openai import OpenAI
import smtplib
import os
import requests
import re
import json

load_dotenv()

app = FastAPI(title="AutoJob Resume Apply AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://autojob-ai-mohammedyounus.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

resume_store = {}

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@app.get("/")
def home():
    return {"message": "AutoJob Resume Apply AI backend running"}


@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are allowed")

    pdf_bytes = await file.read()

    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        resume_text = ""

        for page in reader.pages:
            text = page.extract_text()
            if text:
                resume_text += text + "\n"

        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from resume")

        resume_store["file"] = pdf_bytes
        resume_store["filename"] = file.filename
        resume_store["text"] = resume_text

        return {
            "success": True,
            "message": "Resume uploaded successfully",
            "filename": file.filename,
            "preview": resume_text[:1200],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ats-score")
def ats_score(
    job_role: str = Form(...),
    job_description: str = Form("")
):
    if "text" not in resume_store:
        raise HTTPException(status_code=400, detail="Please upload resume first")

    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY missing")

    resume_text = resume_store["text"][:12000]

    prompt = f"""
You are an ATS resume evaluator.

Analyze this resume for the target role.

Target role:
{job_role}

Job description:
{job_description}

Resume:
{resume_text}

Return only valid JSON. Do not include markdown.

Format:
{{
  "ats_score": 85,
  "match_level": "Strong Match",
  "summary": "short summary",
  "strengths": ["point 1", "point 2", "point 3"],
  "missing_keywords": ["keyword 1", "keyword 2", "keyword 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "recommended_roles": ["role 1", "role 2", "role 3"]
}}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a strict ATS checker. Return only valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
        )

        content = response.choices[0].message.content.strip()
        data = json.loads(content)

        return {"success": True, "ats": data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search-jobs")
def search_jobs(
    role: str = Form(...),
    location: str = Form("India")
):
    serper_key = os.getenv("SERPER_API_KEY")

    if not serper_key:
        raise HTTPException(status_code=500, detail="SERPER_API_KEY missing")

    query = f'{role} jobs {location} apply careers LinkedIn HR email'

    try:
        response = requests.post(
            "https://google.serper.dev/search",
            headers={
                "X-API-KEY": serper_key,
                "Content-Type": "application/json",
            },
            json={"q": query},
            timeout=20,
        )

        data = response.json()
        jobs = []

        for item in data.get("organic", [])[:10]:
            title = item.get("title", "Job Opportunity")
            link = item.get("link", "")
            snippet = item.get("snippet", "")
            company = item.get("source", "Company")

            email_match = re.search(
                r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
                snippet,
            )

            jobs.append({
                "title": title,
                "company": company,
                "link": link,
                "snippet": snippet,
                "hr_email": email_match.group(0) if email_match else "",
                "source": "LinkedIn" if "linkedin.com" in link else "Company Site",
            })

        return {"success": True, "jobs": jobs}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-email")
def generate_email(
    company: str = Form(...),
    role: str = Form(...)
):
    body = f"""
Dear Hiring Team,

I am writing to apply for the {role} position at {company}.

I have attached my resume for your review. I am interested in this opportunity and would be grateful to discuss how my skills can contribute to your team.

Thank you for your time and consideration.

Best regards,
Mohammed Younus
"""

    return {
        "success": True,
        "subject": f"Application for {role}",
        "body": body,
    }


@app.post("/send-resume")
async def send_resume(
    hr_email: str = Form(...),
    company: str = Form(...),
    role: str = Form(...)
):
    if "file" not in resume_store:
        raise HTTPException(status_code=400, detail="Please upload resume first")

    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASS")

    if not email_user or not email_pass:
        raise HTTPException(status_code=500, detail="Email credentials missing")

    msg = EmailMessage()
    msg["Subject"] = f"Application for {role}"
    msg["From"] = email_user
    msg["To"] = hr_email

    msg.set_content(f"""
Dear Hiring Team,

I am interested in applying for the {role} position at {company}.

Please find my resume attached for your review.

Thank you for your time and consideration.

Best regards,
Mohammed Younus
""")

    msg.add_attachment(
        resume_store["file"],
        maintype="application",
        subtype="pdf",
        filename=resume_store["filename"],
    )

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(email_user, email_pass)
            smtp.send_message(msg)

        return {
            "success": True,
            "message": f"Resume sent successfully to {hr_email}",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))