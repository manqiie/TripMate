## backend
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
pip install django-extensions googlemaps pillow drf-nested-routers

<!-- # put venv to gitignore (as this folder is very large, avoid to push this to github)
New-Item -Path ".gitignore" -ItemType "file"
Add-Content -Path ".gitignore" -Value "venv/`nenv/`n.env/" -->

# Create Django project
django-admin startproject tripmate_backend

# Create apps
cd tripmate_backend

python manage.py startapp accounts
/ python manage.py startapp trips

# run each time when create/ update model (database)
python manage.py makemigrations trips
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser

# Run development server
python manage.py runserver

## frontend
# react vite (at root project folder)
npm create vite@latest my-react-app

//framework:react
variant:javascript

# install dependencies
cd my react-app
npm install
npm install react-router-dom
npm install axios
npm install react-icons bootstrap @popperjs/core

# run development server
npm run dev