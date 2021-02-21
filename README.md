# Backend of Momentum.

This project is the API responsible to serve the Momentum application, which consists of a webapp that generates several quantitative strategies, like a portfolio of strategies of stock investiment, with weekly releases of the recommended stocks. Comparisons with past performance and backtest..

## Running

To run the server you have two options. Run as **dev**, which will start the application with [Nodemoon](https://nodemon.io/) and it also
has some dev plugins installed that you can check in **package.json**.

```
yarn dev
```

or as **production**, that is recommended to deploy environment:

```
yarn start
```

## Configure the project

To run the server properly you may need some previous configuration, as it follows.

## Packages

It is important to install all the packages the first time you clone this repo. Since this project uses yarn, you must run:

```
yarn install
```

### Environment

To inform the server which database, port, passwords and any other confidential data, this application uses **.env** file. This file
**must never be commited** to ensure the application's security. So, if you need to run this application locally you will have to create the
**.env** file in root folder and fill it like below:

```
MONGO_URL=<replace it with the database connection link>
PORT=<replace it with the port you wish to serve the application. We recomend port 3000>
```

## Heroku

This server is currently hosted in [Heroku](https://heroku.com/). If for any reason, you need to give maintenance to it. It is important
to understante some things, that will be detailed below.

### Deploy

You can deploy it manually at Heroku's dashboard by going to `deploy > deploy branch`. But it is **not recommended**, to avoid
inconsistencies. This application is setted to be automatically deployd after each `git push`.

#### Procfile

This file is located at root folder and it tells Heroku what to do everytime the project is deployed.

#### Environment

As explained before, the enviorment is where the application is going to run. Since we don't have **.env** file in the repository, you
have to set it in Heroku.

```
Seetings > Reveal Config Vars
```

After that you fill the fields with the var name on the left and its value on the right. It allows you to keep the application safe
and have a different database to development and production enviroments.

## Database

This application uses [MongoDB](https://www.mongodb.com/) as database. The whole configuration is done by their dashboard,
the only thing you must to do in the code is the connection (explained in Environment section).

### Mongoose

[Mongoose](https://mongoosejs.com/) provides a straight-forward, schema-based solution to model your application data. It includes built-in type casting,
validation, query building, business logic hooks and more, out of the box. This is what will make the node.js application works with
MongoDB.

## License

This project is NOT licensend, it means that rights are reserved and it is not Open Source or Free. You cannot modify or redistribute this code without explicit permission from the copyright holder.

## Contact

Cefas Garcia Pereira - [![Linkedin](https://i.stack.imgur.com/gVE0j.png) LinkedIn](https://www.linkedin.com/in/cefas-garcia-pereira-bbaaa080/) &nbsp; - [![GitHub](https://i.stack.imgur.com/tskMh.png) GitHub](https://github.com/cefasgarciapereira) - [cefas.me](https://cefas.me) - cefasgarciapereira@gmail.com

Luis Otávio Abrahão Pinto - [![Linkedin](https://i.stack.imgur.com/gVE0j.png) LinkedIn](https://www.linkedin.com/in/luis-ot%C3%A1vio-abrah%C3%A3o-pinto-a20068ba/)- luisoap2@gmail.com

Project Link: [Quant Research](https://github.com/cefasgarciapereira/momentum-backend)
