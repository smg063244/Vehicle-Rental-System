# Vehicle Rental System with GitHub Actions

## 1. Project Overview

The Vehicle Rental System is a web application designed to manage vehicle information and rental-related operations. It provides a frontend interface and a backend API for managing vehicle records.

## 2. Objectives

* Develop a vehicle management application.
* Implement REST APIs using FastAPI.
* Manage source code using Git and GitHub.
* Automate application testing using GitHub Actions.
* Demonstrate a basic Continuous Integration (CI) workflow.

## 3. Technologies Used

* Frontend: HTML, CSS, JavaScript
* Backend: Python, FastAPI
* Database: SQLAlchemy-compatible database configured by the application
* Version Control: Git
* Code Hosting: GitHub
* CI Automation: GitHub Actions
* Testing: Pytest

## 4. Features

* View vehicle information.
* Add vehicle records.
* Update vehicle information.
* Delete vehicle records.
* Provide REST API endpoints.
* Automatically run tests through GitHub Actions.

*Note: Include only the features that are implemented and working in your application.*

## 5. Project Structure

```text
vehicle-rental-system/
├── main.py
├── requirements.txt
├── .gitignore
├── README.md
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── tests/
│   └── test_main.py
└── .github/
    └── workflows/
        └── ci.yml
```

## 6. How to Run the Project

1. Clone the repository.
2. Create and activate a Python virtual environment.
3. Install the dependencies using `pip install -r requirements.txt`.
4. Start the application using `python -m uvicorn main:app --reload --port 8000`.
5. Open `http://127.0.0.1:8000/docs` to access the API documentation.

## 7. DevOps Implementation

Git is used to track source code changes, and GitHub stores the remote repository. GitHub Actions automatically installs the dependencies and runs the automated tests whenever code is pushed to the configured branch or a pull request is created.

## 8. Expected Outcome

The project demonstrates application development combined with version control and automated testing through a CI workflow.

## 9. Conclusion

The project provides practical experience in developing a web application and implementing a basic DevOps workflow using Git, GitHub, and GitHub Actions.
