# Project Docs

## Getting started

## 1. set up db connection

1.1. Env file

Create a [env](./.env) file in the root of the backend folder and add DATABASE_URL var with our MongoDB string connection e.g.:
```
"mongodb://USERNAME:PASSWORD@HOST/DATABASE"
```

1.2. DB connection

To connect to a MongoDB server, configure the datasource block in [Prisma schema file](./prisma/schema.prisma):

```
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}
```

1.3. Apply migrations into DB:

If you change your data model, you'll need to manually re-generate Prisma Client to ensure the code inside node_modules/.prisma/client gets updated:
```shell
npx prisma generate
```

To apply changes in DB, run:

(optional) you can generate named migration file with `--name migration's name` flag
```shell
 npx prisma db push
```