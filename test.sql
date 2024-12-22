BEGIN;

CREATE OR REPLACE FUNCTION get_user ( id INT ) 
    RETURNS TABLE ( 
        id INT,
        name VARCHAR,
        profile_id INT,
        profile_bio VARCHAR,
        post_id INT,
        post_title VARCHAR
    ) AS $$ BEGIN
    SELECT 
        user.id,
        user.name,
        profile.id  AS profile_id,
        profile.bio AS profile_bio,
        post.id     AS post_id,
        post.title  AS post_title
    FROM
        user
        LEFT JOIN profile   ON user.id = profile.user_id
        LEFT JOIN user_post ON user.id = user_post.user_id
        LEFT JOIN post      ON post.id = user_post.post_id
    END; 
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_profile ( id INT ) 
    RETURNS TABLE ( 
        id INT,
        bio VARCHAR,
        user_id INT,
        user_name VARCHAR
    ) AS $$ BEGIN
    SELECT 
        profile.id,
        profile.bio,
        user.id   AS user_id,
        user.name AS user_name
    FROM
        profile
        LEFT JOIN user ON user.id = profile.user_id
    END; 
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_post ( id INT ) 
    RETURNS TABLE ( 
        id INT,
        title VARCHAR,
        user_id INT,
        user_name VARCHAR
    ) AS $$ BEGIN
    SELECT 
        post.id,
        post.title,
        user.id   AS user_id,
        user.name AS user_name
    FROM
        post
        LEFT JOIN user_post ON post.id = user_post.post_id
        LEFT JOIN user      ON user.id = user_post.user_id
    END; 
$$ LANGUAGE plpgsql;

COMMIT;