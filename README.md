# Project 3

## Deployed Website
https://project3-gang-20-frontend.onrender.com/

**PSQL**
psql -h csce-315-db.engr.tamu.edu -U  gang_20 -d gang_20_db

## dependencies

### root (project3-gang-20)

```Bash
python3 -m venv venv
```

### backend (project3/)

with venv active within project3 folder (backend):
`pip install -r requirements.txt`


### frontend (frontend/)

within frontend folder
`npm install`

## run locally

open two terminals;

### run backend (project3/)

```Bash
source venv/bin/activate
python3 manage.py runserver
```

### run frontend (frontend/)

```Bash
npm run dev
```


