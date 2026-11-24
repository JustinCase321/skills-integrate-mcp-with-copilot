# Mergington High School Activities App

A simple FastAPI application for viewing extracurricular activities and
managing student registrations.

## Features

- View all available extracurricular activities and participants
- Register and unregister students with teacher authentication

## Getting Started

1. Install the dependencies from the repository root:

   ```
   pip install -r requirements.txt
   ```

2. Set teacher usernames and passwords as a JSON object in the environment.
   Keep real credentials in your environment or deployment secret manager,
   never in the repository:

   ```
   export TEACHER_CREDENTIALS='{"teacher":"choose-a-strong-password"}'
   ```

3. Run the application from the repository root:

   ```
   uvicorn src.app:app --reload
   ```

4. Open http://localhost:8000 to view activities. Select the account icon and
   then **Log in** to register or unregister students. The login is held in
   memory for the current page session and ends when you log out or reload.

Use HTTPS when deploying the app so credentials are encrypted in transit.
Without `TEACHER_CREDENTIALS`, activity listings remain public but teacher
login and registration changes are unavailable.

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/activities` | Get all activities and their current participants |
| GET | `/auth/session` | Verify teacher credentials using HTTP Basic auth |
| POST | `/activities/{activity_name}/signup?email=student@mergington.edu` | Register a student (teacher authentication required) |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister a student (teacher authentication required) |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All activity and registration data is stored in memory and resets when the
server restarts.
