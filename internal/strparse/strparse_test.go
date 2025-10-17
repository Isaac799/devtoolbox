package strparse

import (
	"testing"

	"github.com/Isaac799/devtoolbox/pkg/model"
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

func TestParseRaw(t *testing.T) {
	schemas := Raw(testMockSchemas)
	testNoErr(t, schemas)
}

func testNoErr(t *testing.T, schemas []*model.Schema) {
	for _, sch := range schemas {
		if sch.Entities == nil {
			t.Fatal(sch.Name, "nil entities")
		}
		for _, tbl := range sch.Entities {
			if sch.Entities == nil {
				t.Fatal(tbl.Name, "nil attributes")
			}
			for _, attr := range tbl.Attributes {
				if attr.Err == nil {
					continue
				}
				t.Fatal(attr.Err.Error())
			}
		}
	}
}
