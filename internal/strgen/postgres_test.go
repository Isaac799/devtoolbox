package strgen

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/Isaac799/devtoolbox/internal/strparse"
)

const testMockSchemaKitchen = `# Kitchen

## Supplier
- id          as bit with primary, ..16
- name        as str  with required, 3..30

## Ingredient
- id          as bit with primary, ..16
- name        as str  with required, 3..30, unique, d: foo
- eol         as date with required, 2006-01-02..2007-03-04
- rare        as bool with d:false
- flags       as bit with  ..8
- @supplier   with r

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

	m, err := PostgresSetup(schemas)
	if err != nil {
		t.Fatal(err)
	}

	scope := filepath.Join("generated", "pg")
	os.RemoveAll(scope)

	for k, v := range m {
		dir := filepath.Join(scope, k.Path())
		name := filepath.Join(scope, k.Full())

		os.MkdirAll(dir, os.ModePerm)
		os.WriteFile(name, []byte(v), os.ModePerm)
	}
}
