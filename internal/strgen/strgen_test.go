package strgen

import (
	"testing"
)

func TestUpperAcronym(t *testing.T) {
	{
		s := "foo_bar_id"
		s2 := renderCamelUA(s)
		if s2 != "fooBarID" {
			t.Fail()
		}
	}
	{
		s := "id_foo_dob"
		s2 := renderCamelUA(s)
		if s2 != "IDfooDOB" {
			t.Fail()
		}
	}
	{
		s := "foo_bar_id"
		s2 := renderPascalUA(s)
		if s2 != "FooBarID" {
			t.Fail()
		}
	}
	{
		s := "id_foo_dob"
		s2 := renderPascalUA(s)
		if s2 != "IDFooDOB" {
			t.Fail()
		}
	}
}
