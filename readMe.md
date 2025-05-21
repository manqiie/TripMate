# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows
 venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

# If you get an execution policy error, fix it with:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
pip install Django djangorestframework django-cors-headers djangorestframework-simplejwt python-dotenv Pillow mysqlclient

# Create Django project
django-admin startproject tripmate .

# Create apps
python manage.py startapp accounts
python manage.py startapp trips

# Run these commands to set up the database
# Create migrations
python manage.py makemigrations

# Apply migrations to the database
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser

# Run development server
python manage.py runserver


# Create React frontend (in a separate terminal)
npx create-react-app tripmate-frontend
cd tripmate-frontend
npm install axios react-router-dom bootstrap @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons

npm install axios react-router-dom formik yup @mui/material @emotion/react @emotion/styled @mui/icons-material

# Start the development server
npm start

New-Item -Path ".gitignore" -ItemType "file"
Add-Content -Path ".gitignore" -Value "venv/`nenv/`n.env/"


# react vite
npm install react-router-dom
npm install axios
