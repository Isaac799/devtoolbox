package strgen

import (
	"os"
	"testing"

	"github.com/Isaac799/devtoolbox/internal/strparse"
)

const testMockSchemaKitchen = `# Kitchen

## Ingredient
- id          as ++
- name        as str  with required, 3..30, unique
- eol         as date with required
- rare        as bool

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
- @customer  as co         with required, primary
- @recipe            with required, primary
- inserted at as ts   with required, system, default:now`

const testMockSchemas = testMockSchemaKitchen + "\n" + testMockSchemaRestaurant

func TestPostgresSetup(t *testing.T) {
	schemas := strparse.Raw(testMockSchemas)

	pg := PostgresSetup(schemas)
	pg2, err := PostgresSetupTemplate(schemas)
	if err != nil {
		t.Fatal(err)
	}

	os.MkdirAll("generated", os.ModePerm)
	os.WriteFile("generated/pg-raw.sql", []byte(pg), os.ModePerm)
	os.WriteFile("generated/pg-temp.sql", []byte(pg2), os.ModePerm)

	_ = pg
}
