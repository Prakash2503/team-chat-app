# Team Chat App (Mini Slack-like)

A small full-stack team chat application (mini Slack) built as a demo / internship assignment.  
This repository contains a Node.js + Express backend (with Socket.IO) and a plain HTML/CSS/JS frontend (static files). MongoDB is used for persistence.

This README documents how to run the project locally, the API surface, useful troubleshooting steps, and sample requests.

---

## Table of contents

- [Project overview](#project-overview)  
- [Features](#features)  
- [Tech stack](#tech-stack)  
- [Prerequisites](#prerequisites)  
- [Folder structure](#folder-structure)  
- [Environment variables](#environment-variables)  
- [Install & Run (Local)](#install--run-local)  
  - [Backend](#backend)  
  - [Frontend (static)](#frontend-static)  
- [API & Socket summary (sample requests)](#api--socket-summary-sample-requests)  
- [Testing & Debugging tips](#testing--debugging-tips)  
- [Deployment notes](#deployment-notes)  
- [Optional features / next steps](#optional-features--next-steps)  
- [License](#license)

---

## Project overview

This is a minimal, functional chat application that supports:

- User sign up / login (JWT)
- Channels (create / list / join / leave)
- Real-time messaging using Socket.IO
- Message persistence in MongoDB
- Online presence tracking
- Message history with pagination
- Simple frontend (HTML/CSS/JS) that communicates with the backend

The aim is to be a compact, readable demo with a working end-to-end flow.

---

## Features

- Sign up and login with JWT (token stored in `localStorage`)
- Channels: view, create, join, leave
- Real-time messages visible to all users in the same channel
- Message history (pagination)
- Presence indicator (online/offline)
- Clean static frontend using plain HTML/CSS/vanilla JS
- Socket.IO used for real-time events

---

## Tech stack

- Backend: Node.js, Express, Socket.IO, Mongoose (MongoDB)
- Auth: JSON Web Tokens (`jsonwebtoken`) with `bcryptjs` for password hashing
- Frontend: HTML, CSS, vanilla JavaScript (module-based)
- Database: MongoDB (Atlas or local)
- Dev tools: nodemon for backend development, simple static server (python `http.server`) for frontend

---

## Prerequisites

- Node.js (>= 16 recommended)
- npm (bundled with Node)
- MongoDB instance (MongoDB Atlas or local)
- Python 3 (optional — used for serving static frontend via `python -m http.server`)
- Git (optional)

---

## Folder structure

