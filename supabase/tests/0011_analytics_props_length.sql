begin;
select plan(6);

select ok(not has_function_privilege('anon', 'public.jsonb_object_length(jsonb)', 'EXECUTE'), 'anon cannot call the helper');
select ok(not has_function_privilege('authenticated', 'public.jsonb_object_length(jsonb)', 'EXECUTE'), 'authenticated cannot call the helper');

set local role anon;
select lives_ok($$select public.record_analytics_event('anon', 'action_completed', '{"track":"reach","kind":"manual","n":1}'::jsonb)$$, 'action_completed with props is recorded');
select lives_ok($$select public.record_analytics_event('anon', 'share', '{"channel":"copy"}'::jsonb)$$, 'share with props is recorded');
select throws_ok($$select public.record_analytics_event('anon', 'share', '{"channel":"copy","email":"x"}'::jsonb)$$, 'P0001', 'event or properties not allowed', 'extra properties are still rejected');
select lives_ok($$select public.record_analytics_event('anon', 'visited', '{}'::jsonb)$$, 'prop-less events still work');

select * from finish();
rollback;
