ALTER TABLE IF EXISTS travelmate.two_factor_auth
    ALTER COLUMN secret_key TYPE character varying(64);
