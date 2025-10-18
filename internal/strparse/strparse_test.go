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
			for _, attr := range ent.Attributes {
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

func TestNormalize(t *testing.T) {
	{
		s := "2 FAST 4 u"
		s2 := normalize(s)
		if s2 != "fast_4_u" {
			t.Fail()
		}
	}
	{
		s := "slow snail"
		s2 := normalize(s)
		if s2 != "slow_snail" {
			t.Fail()
		}
	}
	{
		s := "Run Fast - Small spider!"
		s2 := normalize(s)
		if s2 != "run_fast_small_spider" {
			t.Fail()
		}
	}
}
