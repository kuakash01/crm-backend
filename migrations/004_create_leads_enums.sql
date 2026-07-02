
CREATE TYPE lead_status AS ENUM (
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'PROPOSAL',
    'NEGOTIATION',
    'CONVERTED',
    'LOST'
);

CREATE TYPE lead_source AS ENUM (
    'WEBSITE',
    'FACEBOOK',
    'GOOGLE',
    'REFERRAL',
    'MANUAL'
);