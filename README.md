# Boilerplate

I love data structure because once you have that _everything_ else builds itself. I get excited just thinking about it!

> I am hosting it here [https://devtoolbox.org](https://devtoolbox.org) at the moment. Please be kind to my web server.

This projects is designed to take in a reasonable syntax and generate an unreasonable amount of code. From there, you can add, remove, or modify it to your needs.

When tasked with being a "full stack" developer, I feel tools like this can come in handy. Mostly because I get tired of solving the same problems over and over, just adding to the swamp of microservices.

## Development Stage

Note this application is currently in early development. Outputs are largely untested. For now a lot of what I have is just proof of concept.

Plus most of the outputs are based on my limited syntax knowledge and off the top of my head; prone to error and not verbose.

## Goals

I am open to contributions. If you would like to, here are some goals I had in mind.

In general, I like to stay away from using a library since this is a pet project where I like to try and solve the problems myself. For example, I learned about using webpack for the first time when working on this project.

- Testing and validation on existing code generators
- New code generators, adding support for more languages. Specifically Go would be cool
- A fun drag drop gui users can elect to use (not to replace the text editor)
- Some kind of way to define an "Old" and "New" of data structure, and have it write a conversion script from one PostgreSql layout to another, or from JSON schema into PostgreSql, or MSSQL to PostgreSQL. Not exactly sure what this would look like yet, and may need a more realized GUI too.

### Why Markdown?

It is popular, lowering the bar to entry. Let people use existing markdown tools, like formatters.

All that said, the formatters I like to use for markdown break the syntax for this application. Things like spacing and escaped characters. So this will need revisited.

## Features

Here are some general features of the application. The [syntax guide](#syntax-guide) has most features, so here are some less obvious ones.

- **PostgreSQL**

     - All aspects (entities, functions, procedures, joins...) take into account a composite primary key
     - The update procedure ignores attributes marked as readonly
     - Up to three read functions are generated.
          1. Single is basic, letting you read by primary key
          2. Options gives a trimmed down list if things in the table
                - automatically done if an attribute is named `[ name | label | value | code | tag ]`
                - aimed to help with dropdown list / selection needs
          3. Joined recursively grabs foreign attributes too
                - Automatically generated if a foreign key is present, recursive
                - Limited for self references

- **Node JS Express**

     - GET, PUT, POST, DELETE endpoints that utilizes the PostgreSQL functions and procedures
     - Handholding when making requests, checking for things missed that it expects on a request
     - Error handling for failed queries

- **Html** (mostly proof of concept)
     - Form for each CRUD operation needed that aligns with all endpoints created by Node JS Express

## Syntax Guide

### Schemas

`## identifier`

| Category | Symbol | Description                         | Example         |
| -------- | ------ | ----------------------------------- | --------------- |
|          | `##`   | groups entities below into a schema | `## historical` |

### Tables / Entities

`- identifier [...FLAG]`

| Category | Symbol                | Description                                                                           | Example         |
| -------- | --------------------- | ------------------------------------------------------------------------------------- | --------------- |
|          | `-`                   | creates an entity                                                                     | `- dragon`      |
| flag     | `+`                   | auto generate a id                                                                    | `- dragon +`    |
| flag     | `@`                   | auto generate a creation timestamp                                                    | `- dragon @`    |
| flag     | `crud` various casing | generates logic for capitalized letters. C = Create, R = Read, U = Update, D = Delete | `- dragon cRud` |

### Columns / Attributes

`  - [TYPE] [PREFIX MODIFIER]value[APPEND MODIFIER] [...FLAG]`

| Category        | Symbol                                                 | Description                                             | Example                 |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------- | ----------------------- |
|                 | `  -`                                                  | creates an attribute                                    | `  -`                   |
| type            | `  - [ b \| bool \| boolean ]`                         | creates an attribute of type **boolean**                | `  - boolean alive`     |
| type            | `  - [ c \| char \| character ]`                       | creates an attribute of type **character**              | `  - character status`  |
| type            | `  - bit`                                              | creates an attribute of type **bit**                    | `  - bit state`         |
| type            | `  - [ i \| int \| integer ]`                          | creates an attribute of type **integer**                | `  - integer count`     |
| type            | `  - [ d \| dec \| decimal ]`                          | creates an attribute of type **decimal**                | `  - decimal cost`      |
| type            | `  - [ f \| float ]`                                   | creates an attribute of type **float**                  | `  - float weight`      |
| type            | `  - [ r \| real ]`                                    | creates an attribute of type **real**                   | `  - real weight`       |
| type            | `  - [ dt \| date ]`                                   | creates an attribute of type **date**                   | `  - date birthday`     |
| type            | `  - [ t \| time ]`                                    | creates an attribute of type **time**                   | `  - time start`        |
| type            | `  - [ ts \| timestamp ]`                              | creates an attribute of type **timestamp**              | `  - timestamp created` |
| type            | t-shirt sizes `  - [ xs \| s \| m \| l \| xl \| xxl ]` | creates an attribute of type **varchar(n)**             | `  - m description`     |
| type            | `  - ^`                                                | creates a **reference** to another entity               | `  - ^ color`           |
| flag            | `[ * \| ** \| *** \| and more ]`                       | flags a value(s) as **unique** with matching star count | `  - b alive *`         |
| flag            | `!`                                                    | flags a value as **not nullable**                       | `  - b alive !`         |
| flag            | `?`                                                    | flags a value as **default null**                       | `  - b alive ?`         |
| append modifier | ` \|` delimiter                                        | creates an **alias** for a reference                    | ` - ^ dragon \| mother` |
| prefix modifier | `_` prefix                                             | gives the **readonly** attribute to an entity           | `  - _birthday !`       |
| flag            | everything else                                        | sets the **default value** for an attribute             | `  - b alive false`     |

### Examples

#### Simple

A simple example with just some tables and references. Add `Crud` next to a table to see how the output changes.

```txt
- store +
  - s name

- toy + @
  - s name
  - f _cost
  - b broken
  - ^ store|purchased_from

- cat +
  - s name * !
  - ts _birthday ! CURRENT_TIMESTAMP
  - b alive !

- cat_toy
  - ^ cat +
  - ^ toy +
```

#### Complicated

Here is a more complicated example. Some things are done mostly to showcase / act as a stress test for me when working on it. For example, person composite primary key of their names is not ideal in real word, but fine for this example.

```txt
## creature

- person CRUD
  - s first_name +
  - s last_name +
  - ts _birthday ! CURRENT_TIMESTAMP
  - b alive !

## world

- kingdom +
  - s name *
  - m description

- village +
  - ^ kingdom|ruled_by **
  - ^ creature.person|elder *
  - s name **

- tavern +
  - ^ village *
  - s name *
  - b has_food
  - b vacancy

- patron + @ CRUD
  - ^ _creature.person ! * **
  - ^ _tavern ! *
  - ts departed_on ?
  - b paid
```

## Installation & Usage

```bash
git clone https://github.com/Isaac799/boilerplate
cd boilerplate
npm install
npm run dev
```

```bash
npm run build
```

## License

This project is licensed under the [MIT License](LICENSE)
