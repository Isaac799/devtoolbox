CREATE OR REPLACE FUNCTION public.get_user ( id INT ) 
    RETURNS TABLE ( 
        user_id INT,
        user_name VARCHAR,
        user_email VARCHAR,
        profile_bio VARCHAR,
        profile_status CHARACTER,
        listing_inserted_at TIMESTAMP,
        listing_sold BOOLEAN,
        listing_item_id INT,
        listing_item_description VARCHAR,
        finance_purchase_when TIMESTAMP,
        finance_purchase_amount MONEY,
        finance_purchase_status CHARACTER,
        purchase_item2_id INT,
        purchase_item2_description VARCHAR
    ) AS $$ BEGIN RETURN QUERY
    SELECT 
        User.id                   AS user_id,
        User.name                 AS user_name,
        User.email                AS user_email,
        Profile.bio               AS profile_bio,
        Profile.status            AS profile_status,
        Listing.inserted_at       AS listing_inserted_at,
        Listing.sold              AS listing_sold,
        ListingItem.id            AS listing_item_id,
        ListingItem.description   AS listing_item_description,
        FinancePurchase.when      AS finance_purchase_when,
        FinancePurchase.amount    AS finance_purchase_amount,
        FinancePurchase.status    AS finance_purchase_status,
        PurchaseItem2.id          AS purchase_item2_id,
        PurchaseItem2.description AS purchase_item2_description
    FROM
        public.user User
        LEFT JOIN public.profile Profile           ON Profile.user_id          = User.id
        LEFT JOIN public.listing Listing           ON Listing.listee_id        = User.id
        LEFT JOIN public.item ListingItem          ON ListingItem.id           = Listing.item_id
        LEFT JOIN finance.purchase FinancePurchase ON FinancePurchase.payer_id = User.id
        LEFT JOIN public.item PurchaseItem2        ON PurchaseItem2.id         = Purchase.what_id
    WHERE
        User.id = id;
    END; 
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_item ( id INT ) 
    RETURNS TABLE ( 
        item_id INT,
        item_description VARCHAR,
        listing_inserted_at TIMESTAMP,
        listing_sold BOOLEAN,
        listing_user_id INT,
        listing_user_name VARCHAR,
        listing_user_email VARCHAR,
        finance_purchase_when TIMESTAMP,
        finance_purchase_amount MONEY,
        finance_purchase_status CHARACTER,
        purchase_user2_id INT,
        purchase_user2_name VARCHAR,
        purchase_user2_email VARCHAR
    ) AS $$ BEGIN RETURN QUERY
    SELECT 
        Item.id                AS item_id,
        Item.description       AS item_description,
        Listing.inserted_at    AS listing_inserted_at,
        Listing.sold           AS listing_sold,
        ListingUser.id         AS listing_user_id,
        ListingUser.name       AS listing_user_name,
        ListingUser.email      AS listing_user_email,
        FinancePurchase.when   AS finance_purchase_when,
        FinancePurchase.amount AS finance_purchase_amount,
        FinancePurchase.status AS finance_purchase_status,
        PurchaseUser2.id       AS purchase_user2_id,
        PurchaseUser2.name     AS purchase_user2_name,
        PurchaseUser2.email    AS purchase_user2_email
    FROM
        public.item Item
        LEFT JOIN public.listing Listing           ON Listing.item_id         = Item.id
        LEFT JOIN public.user ListingUser          ON ListingUser.id          = Listing.listee_id
        LEFT JOIN finance.purchase FinancePurchase ON FinancePurchase.what_id = Item.id
        LEFT JOIN public.user PurchaseUser2        ON PurchaseUser2.id        = Purchase.payer_id
    WHERE
        Item.id = id;
    END; 
$$ LANGUAGE plpgsql;
