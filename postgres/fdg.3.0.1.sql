-- CREATE ROLE fdg WITH LOGIN PASSWORD 'This_is_the_temporary_password_for_fdg';

-- CREATE DATABASE fdg
--     WITH OWNER = fdg
--        ENCODING = 'UTF8'
--        TABLESPACE = pg_default
--        LC_COLLATE = 'en_US.UTF-8'
--        LC_CTYPE = 'en_US.UTF-8'
--        CONNECTION LIMIT = -1;

-- \c fdg;

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO fdg;
COMMENT ON SCHEMA public
  IS 'FDG public schema, shard 001';

-- Functions
CREATE EXTENSION IF NOT EXISTS plv8;

CREATE OR REPLACE FUNCTION uuid_v6() RETURNS uuid AS
$$
    const R = Math.random;
    const D = () => (R()*16|0).toString(16);
    const B = () => (R()*16|0&0x3|0x8).toString(16);
    const t = ('000000000000'+new Date().getTime().toString(16)).slice(-12);
    return t.slice(0, 8)+
        '-'+t.slice(-4)+
        '-6001'+
        '-'+B()+D()+D()+D()+
        '-'+D()+D()+D()+D()+D()+D()+D()+D()+D()+D()+D()+D();
$$ LANGUAGE plv8 VOLATILE;

CREATE OR REPLACE FUNCTION modified_at_trigger() RETURNS trigger AS
$$
    NEW.modified_at = new Date();
    return NEW;
$$ LANGUAGE plv8 VOLATILE;

-- Type Tables
CREATE TABLE entity_type (
    id UUID PRIMARY KEY DEFAULT uuid_v6(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    color TEXT NOT NULL DEFAULT '#cccccc'
);
ALTER TABLE entity_type OWNER TO fdg;
CREATE TRIGGER entity_type_mod BEFORE UPDATE ON entity_type FOR EACH ROW EXECUTE PROCEDURE modified_at_trigger();
INSERT INTO entity_type (name, description, color) VALUES
('Generic', 'Generic entity', '#cccccc'),
('Lookup', 'Entity used for typing or classifying other entities.', '#ffff00'),
('View', 'Derived entity created from one or more source entities.', '#ffff00')
;

CREATE TABLE attribute_type (
    id UUID PRIMARY KEY DEFAULT uuid_v6(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true
);
ALTER TABLE attribute_type OWNER TO fdg;
CREATE TRIGGER attribute_type_mod BEFORE UPDATE ON attribute_type FOR EACH ROW EXECUTE PROCEDURE modified_at_trigger();
INSERT INTO attribute_type (name, description) VALUES
('UUID', 'A Universally Unique IDentifier attribute.'),
('String', 'A text attribute'),
('Date', 'An ISO date attribute.'),
('Number', 'A numeric attribute.'),
('Boolean', 'A boolean attribute.')
;

CREATE TABLE relationship_type (
    id UUID PRIMARY KEY DEFAULT uuid_v6(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true
);
ALTER TABLE relationship_type OWNER TO fdg;
CREATE TRIGGER relationship_type_mod BEFORE UPDATE ON relationship_type FOR EACH ROW EXECUTE PROCEDURE modified_at_trigger();
INSERT INTO relationship_type (name, description) VALUES
('One To Many', 'One alpha entity to Many beta entities.'),
('One To One', 'One alpha entity to One beta entity.')
;

-- Main Tables
CREATE TABLE client (
    id UUID PRIMARY KEY DEFAULT uuid_v6(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    legal_name TEXT
);
ALTER TABLE client OWNER TO fdg;
CREATE TRIGGER client_mod BEFORE UPDATE ON client FOR EACH ROW EXECUTE PROCEDURE modified_at_trigger();
INSERT INTO client (id, name) VALUES
('01638c33-b6d4-6001-c421-3d53f2577b53','MWL'),
('01638c33-b6d4-6001-805f-49ba6a8a7800','ACC'),
('01638c33-b6d4-6001-e279-35eea314d6a5','BBN'),
('01638c33-b6d4-6001-a4ef-91fd3a8835cd','CRL'),
('01638c33-b6d4-6001-e91f-22c16bad24df','DGB'),
('01638c33-b6d4-6001-d9de-48db4d169df3','PSO'),
('01638c33-b6d4-6001-a9ba-a11ea15b9102','SLO')
;

CREATE TABLE project (
    id UUID PRIMARY KEY DEFAULT uuid_v6(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    client_id UUID NOT NULL REFERENCES client(id),
    code_name TEXT NOT NULL,
    repository_data JSONB NOT NULL DEFAULT '{}'
);
ALTER TABLE project OWNER TO fdg;
CREATE TRIGGER project_mod BEFORE UPDATE ON project FOR EACH ROW EXECUTE PROCEDURE modified_at_trigger();
INSERT INTO project (id, name, client_id, code_name) VALUES
('01638c36-12d9-6001-9788-8a078f85fdbb','midwestlogic.com','01638c33-b6d4-6001-c421-3d53f2577b53','mwl.com'),
('01638c36-9608-6001-afc4-76dbe86b9bed','Document Manipulator','01638c33-b6d4-6001-805f-49ba6a8a7800','docman'),
('01638c37-4619-6001-954b-c83ef7bb38b2','Billing and Commissions','01638c33-b6d4-6001-e279-35eea314d6a5','bibi'),
('01638c39-856b-6001-d141-130c3947190c','Diagnostic Requisition Processing','01638c33-b6d4-6001-a4ef-91fd3a8835cd','dialab'),
('01638c3a-645f-6001-a3ca-3186de83e40b','Fuditext (Skip) Order Processing','01638c33-b6d4-6001-e91f-22c16bad24df','skip'),
('01638c3b-b3cc-6001-99e9-3a4f5b988242','Prestio - The Amazon of Car Buying','01638c33-b6d4-6001-d9de-48db4d169df3','prestio'),
('01638c40-1ce3-6001-d000-99a035cdf17b','Soleo - Home Health Infusions Management','01638c33-b6d4-6001-a9ba-a11ea15b9102','slo')
;

CREATE TABLE entity (
    id UUID PRIMARY KEY DEFAULT uuid_v6(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES project(id),
    entity_type_id UUID NOT NULL REFERENCES entity_type(id),
    color TEXT,
    address JSONB NOT NULL DEFAULT '[0,0,0,0]'
);
ALTER TABLE entity OWNER TO fdg;
COMMENT ON COLUMN entity.address IS 'A quadray coordinate. See http://www.grunch.net/synergetics/quadintro.html';
CREATE TRIGGER entity_mod BEFORE UPDATE ON entity FOR EACH ROW EXECUTE PROCEDURE modified_at_trigger();

CREATE TABLE attribute (
    id UUID PRIMARY KEY DEFAULT uuid_v6(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    attribute_type_id UUID NOT NULL REFERENCES attribute_type(id),
    entity_id UUID NOT NULL REFERENCES entity(id),
    primary_key BOOLEAN NOT NULL DEFAULT false,
    input BOOLEAN NOT NULL DEFAULT true,
    output BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE attribute OWNER TO fdg;
CREATE TRIGGER attribute_mod BEFORE UPDATE ON attribute FOR EACH ROW EXECUTE PROCEDURE modified_at_trigger();

CREATE TABLE relationship (
    id UUID PRIMARY KEY DEFAULT uuid_v6(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    relationship_type_id UUID NOT NULL REFERENCES relationship_type(id),
    alpha_attribute_id UUID REFERENCES attribute(id),
    alpha_required BOOLEAN DEFAULT true,
    beta_attribute_id UUID REFERENCES attribute(id),
    beta_required BOOLEAN DEFAULT true
);
ALTER TABLE relationship OWNER TO fdg;
CREATE TRIGGER relationship_mod BEFORE UPDATE ON relationship_type FOR EACH ROW EXECUTE PROCEDURE modified_at_trigger();

CREATE TABLE plugin (
    id UUID PRIMARY KEY DEFAULT uuid_v6(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'
);
ALTER TABLE plugin OWNER TO fdg;
CREATE TRIGGER plugin_mod BEFORE UPDATE ON plugin FOR EACH ROW EXECUTE PROCEDURE modified_at_trigger();
