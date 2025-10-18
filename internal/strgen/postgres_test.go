package strgen

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/Isaac799/devtoolbox/internal/strparse"
)

const testMockSchemaKitchen = `# Kitchen

## Ingredient
- id          as ++
- name        as str  with required, 3..30, unique, d: foo
- eol         as date with required
- rare        as bool with d:false

## Food
- id          as ++
- name        as str  with required, 3..30, unique

## Recipe
- @food               with required, primary
- @ingredient         with required, primary
- amount      as int  with required`

const testMockSchemaRestaurant = `# Restaurant

## Customer
- id          as ++
- first name  as str  with required, 3..30, unique:fl
- last name   as str  with required, 3..30, unique:fl, unique:ldob
- dob         as date with unique:ldob
- last visit  as ts   with required, default:now

## Order
- @customer          with required, primary
- @recipe            with required, primary
- inserted at as ts   with required, system, default:now`

const testMockSchemaFoo = `# Foo

## Order
- @Kitchen.food      as co 
- @Kitchen.Recipe       with required, primary
- @Restaurant.Customer          with required
- @Restaurant.order            with required
`

const testMockSchemas = testMockSchemaKitchen + "\n" + testMockSchemaRestaurant + "\n" + testMockSchemaFoo

func TestPostgresSetup(t *testing.T) {
	wd, _ := os.Getwd()
	os.Chdir("..")
	os.Chdir("..")
	defer os.Chdir(wd)

	schemas := strparse.Raw(testMockSchemas)

	pg, err := PostgresSetup(schemas)
	if err != nil {
		t.Fatal(err)
	}

	p := filepath.Join("generated", "postgres")
	os.RemoveAll(p)
	os.MkdirAll(p, os.ModePerm)
	fileName := filepath.Join(p, "tables.sql")
	os.WriteFile(fileName, []byte(pg), os.ModePerm)

	_ = pg
}
