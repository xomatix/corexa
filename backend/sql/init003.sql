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

CREATE OR REPLACE FUNCTION save_user_password(p_session_user jsonb, p_input_data jsonb)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_session_usr_id uuid;
    v_session_issuperuser boolean;

    v_usr_id uuid;
    v_password_hash text;
    v_username text;
    v_email text;
    v_displayname text;
    v_isactive boolean;
    v_issuperuser boolean;
    v_passwords_match boolean;
    v_sql text;
BEGIN

    v_session_usr_id := (p_session_user->>'id')::uuid;
    v_session_issuperuser := COALESCE((p_session_user->>'is_superuser')::boolean, FALSE);

    v_usr_id := (p_input_data->>'id')::uuid;
    v_password_hash := p_input_data->>'password'; 
    v_passwords_match := p_input_data->>'password' = p_input_data->>'password2'; 
    
    v_username      := p_input_data->>'username';
    v_email         := p_input_data->>'email';
    v_displayname   := p_input_data->>'display_name';
    v_isactive      := COALESCE((p_input_data->>'is_active')::boolean, FALSE);
    v_issuperuser   := COALESCE((p_input_data->>'is_superuser')::boolean, FALSE);
   
   	IF v_password_hash IS NULL OR v_password_hash = '' THEN
        RETURN format('select %L as error', 'Password cannot be empty.');
    END IF;
   
   	v_password_hash := md5(v_password_hash);
   
    if v_passwords_match <> true or v_passwords_match is null then
        RETURN format('select %L as error', 'The passwords you entered do not match');
    END IF;
   
    IF NOT (v_session_issuperuser OR v_session_usr_id = v_usr_id) THEN
        RETURN format('select %L as error', 'Insufficient permissions. You can only change your own password.');
    END IF;
       
    update users 
    set password_hash = v_password_hash 
    where id = v_usr_id;
    
    v_sql := 'SELECT ''success'' as info';

    RETURN v_sql;
END;
$function$;


CREATE OR REPLACE FUNCTION audit_log_fn(
    action varchar(1), 
    user_id uuid, 
    collection_id uuid, 
    record_id uuid, 
    record jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$    
BEGIN    
    INSERT INTO audit_logs (
        collection_id,
        action,
        record_id,
        record,
        changed_at,
        changed_user_id
    )
    VALUES (
        collection_id,
        action,
        record_id,
        record,
        now(),
        user_id
    );

    RETURN TRUE;

EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;
