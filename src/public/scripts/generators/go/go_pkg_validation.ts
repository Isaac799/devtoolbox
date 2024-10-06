import { CodeGenerator } from '../../core/structure';

export class GoPkgValidation extends CodeGenerator {
        Run() {
                this.output[`/pkg/validation/validation.go`] = GoPkgValidation.validation;
                this.output[`/pkg/validation/changeset.go`] = GoPkgValidation.changeset;

                return this;
        }

        private static readonly validation = `package validation

import "fmt"

// ValidateNumber checks if the number is within the specified range (inclusive).
func ValidateNumber(num, min, max int) error {
    if num < min || num > max {
        return fmt.Errorf("number %d is out of range (%d to %d)", num, min, max)
    }
    return nil
}

// ValidateString checks if the string length is within the specified limits (inclusive).
func ValidateString(s string, minLen, maxLen int) error {
    length := len(s)
    if length < minLen || length > maxLen {
        return fmt.Errorf("string length %d is out of bounds (%d to %d)", length, minLen, maxLen)
    }
    return nil
}

// ValidateFloat64 checks if the float64 number is within the specified range (inclusive).
func ValidateFloat64(num float64, min, max float64) error {
    if num < min || num > max {
        return fmt.Errorf("float %f is out of range (%f to %f)", num, min, max)
    }
    return nil
}
`;
        private static readonly changeset = `package validation

type ValidationForOperation int

const (
    Create ValidationForOperation = iota
    Update
)

type Changeset[T any] struct {
    Record *T
    Errors map[string]string
}

func NewChangeset[T any](record *T) Changeset[T] {
    return Changeset[T]{
        Record: record,
        Errors: make(map[string]string),
    }
}

func (cs Changeset[T]) IsValid() bool {
    return len(cs.Errors) == 0
}
`;
}
