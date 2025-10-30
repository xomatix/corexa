CREATE OR REPLACE FUNCTION invoke_json_procedure(
    p_procedure_name text,
    p_session_user jsonb,
    p_input_data jsonb
)
RETURNS text AS $$
DECLARE
    v_returned_sql text;
BEGIN
    -- Dynamically execute the specified procedure with the provided JSON data
    EXECUTE format('SELECT %s(%L::jsonb, %L::jsonb)', p_procedure_name, p_session_user, p_input_data)
    INTO v_returned_sql;

    -- Return the SQL obtained from the executed procedure
    RETURN v_returned_sql;
END;
$$ LANGUAGE plpgsql;