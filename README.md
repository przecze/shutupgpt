[live version](https://shutupgpt.janczechowski.com)

## About

ShutUpGPT is a prompt injection challenge where GPT-4o is instructed to provide a secret nuclear code but only after giving lengthy safety warnings—your goal is to make it skip the lecture and just give you the code. The leaderboard ranks by how few characters appear before the code, rewarding those who get GPT to shut up fastest.

## Tech Stack

- **Backend**: Python, FastAPI, OpenAI API
- **Frontend**: React, Vite
- **Infrastructure**: Docker, Nginx, Ansible

## Setup

1. Save your OpenAI API key as a plain string in `backend/openai_api_key`
2. `docker compose up -d --build` to start the application
3. Access at http://localhost:8080

## Model

Only GPT-4o is supported.
