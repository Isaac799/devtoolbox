```sql
CREATE TABLE catalog.product_category (
    product_id  INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (product_id, category_id),
    FOREIGN KEY (product_id) REFERENCES catalog.product(id),
    FOREIGN KEY (category_id) REFERENCES catalog.category(id)
);

-- Creating indexes separately
CREATE INDEX idx_product_id ON catalog.product_category(product_id);
CREATE INDEX idx_category_id ON catalog.product_category(category_id);
```
