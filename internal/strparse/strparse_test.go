package strparse

import (
	"testing"

	"github.com/Isaac799/devtoolbox/internal"
	"github.com/Isaac799/devtoolbox/pkg/model"
)

const testMockSchemaKitchen = `# Kitchen

## Supplier
- id          as ++
- name        as str  with required, 3..30, unique

## Ingredient
- id          as ++
- name        as str  with required, 3..30, unique
- eol         as date with required
- rare        as bool
- @supplier

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
- @kitchen.recipe            with required, primary
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
		for _, ent := range sch.Entities {
			if sch.Entities == nil {
				t.Fatal(ent.Name, "nil attributes")
			}
			for _, attr := range ent.RawAttributes {
				if attr.Err == nil {
					continue
				}
				for _, err := range attr.Err {
					t.Fatal(err.Error())
				}
			}
		}
	}
}

func TestRecursiveRead(t *testing.T) {
	schemas := Raw(testMockSchemas)

	attrs := schemas[1].Entities[1].Attributes()

	for i, attr := range attrs {
		if attr.Attribute.Err != nil {
			continue
		}
		if attr.DirectChild {
			continue
		}
		if i == 0 && attr.Name() != "co_id" {
			t.Fatal("bad name: ", attr.Name())
		}
		if i == 1 && attr.Name() != "kitchen_recipe_food_id" {
			t.Fatal("bad name: ", attr.Name())
		}
		if i == 2 && attr.Name() != "kitchen_recipe_ingredient_id" {
			t.Fatal("bad name: ", attr.Name())

		}
	}
}

func TestNormalize(t *testing.T) {
	{
		s := "2 FAST 4 u"
		s2 := internal.Normalize(s)
		if s2 != "fast_4_u" {
			t.Fail()
		}
	}
	{
		s := "slow snail"
		s2 := internal.Normalize(s)
		if s2 != "slow_snail" {
			t.Fail()
		}
	}
	{
		s := "Run Fast - Small spider!"
		s2 := internal.Normalize(s)
		if s2 != "run_fast_small_spider" {
			t.Fail()
		}
	}
}
