i7el - The Inform 7 Extensions Library
======================================

[![npm dependencies](https://img.shields.io/david/i7/i7el.svg)](https://david-dm.org/i7/i7el) [![cdnjs dependencies](https://img.shields.io/david/dev/i7/i7el.svg?label=cdnjs)](https://david-dm.org/i7/i7el#info=devDependencies)

An Inform 7 extensions library web service, written with node.js

Setting up an i7el installation
-------------------------------

i7el will need a Postgresql database, and these enviroment variables set:

 - DATABASE_URL: A Postgresql database url, as provide by Heroku Postgres
 - NODE_ENV: Set to 'development' to use development options
 - PORT: Web server port
 - SITE_URL: External URL for this site

After installing sequelize-cli, use this command to create the database tables:

```
sequelize db:migrate
```

You will then need to manually create one row in the Settings table with a key of 'core' and value of the following, with your details inserted:

```
{
    "admins": ["Your email address"],
    "editors": [],
    "releases": [],
    "sessionsecret": "keyboardcat: random text for the session encryption",
    "google": {
        "key": "Your Google API key",
        "secret": "Your Google API secret"
    }
}
```

This will allow you to log in, and you can change further settings in the admin page.
