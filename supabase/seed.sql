-- Local/dev seed data. Applied by `supabase db reset` AFTER all migrations run.
-- NOT part of remote migration history and never replayed by `supabase db push`.
-- Moved here from the (now-squashed) 20260521090100_exercises_seed.sql.
--
-- NOTE: the global foods library seed lives in a real migration
-- (20260616100100_foods_seed.sql) because it was added this session and is part
-- of the migration history; only the exercises seed was relocated here.

-- Global exercise library seed (coach_id null). Bilingual, MENA gym + bodyweight staples.
-- on conflict guard keeps `db reset` re-runnable without duplicating rows.
insert into public.exercises (name_en, name_ar, muscle_group, equipment, video_url) values
('Barbell Bench Press','بنش بريس بالبار','chest','barbell','https://www.youtube.com/watch?v=rT7DgCr-3pg'),
('Incline Dumbbell Press','بريس دمبل مائل','chest','dumbbell','https://www.youtube.com/watch?v=8iPEnn-ltC8'),
('Chest Press Machine','جهاز ضغط الصدر','chest','machine',null),
('Cable Fly','تفتيح كابل','chest','cable','https://www.youtube.com/watch?v=Iwe6AmxVf7o'),
('Push-Up','ضغط','chest','bodyweight','https://www.youtube.com/watch?v=IODxDxX7oi4'),
('Pull-Up','عقلة','back','bodyweight','https://www.youtube.com/watch?v=eGo4IYlbE5g'),
('Lat Pulldown','سحب أمامي','back','cable','https://www.youtube.com/watch?v=CAwf7n6Luuc'),
('Seated Cable Row','تجديف كابل جالس','back','cable','https://www.youtube.com/watch?v=GZbfZ033f74'),
('Barbell Row','تجديف بالبار','back','barbell','https://www.youtube.com/watch?v=9efgcAjQe7E'),
('Deadlift','رفعة ميتة','back','barbell','https://www.youtube.com/watch?v=op9kVnSso6Q'),
('Overhead Press','بريس كتف واقف','shoulders','barbell','https://www.youtube.com/watch?v=2yjwXTZQDDI'),
('Dumbbell Shoulder Press','بريس كتف دمبل','shoulders','dumbbell','https://www.youtube.com/watch?v=qEwKCR5JCog'),
('Lateral Raise','رفرفة جانبي','shoulders','dumbbell','https://www.youtube.com/watch?v=3VcKaXpzqRo'),
('Cable Lateral Raise','رفرفة جانبي كابل','shoulders','cable','https://www.youtube.com/watch?v=WF9oZyEHnU4'),
('Face Pull','سحب للوجه','shoulders','cable','https://www.youtube.com/watch?v=rep-qVOkqgk'),
('Barbell Squat','سكوات بالبار','legs','barbell','https://www.youtube.com/watch?v=ultWZbUMPL8'),
('Leg Press','جهاز دفع الأرجل','legs','machine','https://www.youtube.com/watch?v=IZxyjW7MPJQ'),
('Romanian Deadlift','رفعة رومانية','legs','barbell','https://www.youtube.com/watch?v=jEy_czb3RKA'),
('Leg Extension','تمديد الأرجل','legs','machine','https://www.youtube.com/watch?v=YyvSfVjQeL0'),
('Leg Curl','ثني الأرجل','legs','machine','https://www.youtube.com/watch?v=1Tq3QdYUuHs'),
('Walking Lunge','اندفاع مشي','legs','dumbbell','https://www.youtube.com/watch?v=L8fvypPrzzs'),
('Standing Calf Raise','رفع السمانة واقف','legs','machine','https://www.youtube.com/watch?v=gwLzBJYoWlI'),
('Barbell Curl','مرجحة بايسبس بالبار','arms','barbell','https://www.youtube.com/watch?v=kwG2ipFRgfo'),
('Dumbbell Curl','مرجحة بايسبس دمبل','arms','dumbbell','https://www.youtube.com/watch?v=ykJmrZ5v0Oo'),
('Hammer Curl','مرجحة هامر','arms','dumbbell','https://www.youtube.com/watch?v=zC3nLlEvin4'),
('Triceps Pushdown','دفع ترايسبس كابل','arms','cable','https://www.youtube.com/watch?v=2-LAMcpzODU'),
('Overhead Triceps Extension','تمديد ترايسبس علوي','arms','dumbbell','https://www.youtube.com/watch?v=YbX7Wd8jQ-Q'),
('Skull Crusher','سكال كراشر','arms','barbell','https://www.youtube.com/watch?v=d_KZxkY_0cM'),
('Plank','بلانك','core','bodyweight','https://www.youtube.com/watch?v=pSHjTRCQxIw'),
('Hanging Leg Raise','رفع الأرجل معلق','core','bodyweight','https://www.youtube.com/watch?v=Pr1ieGZ5atk'),
('Cable Crunch','كرنش كابل','core','cable','https://www.youtube.com/watch?v=2fbujnGCFmA'),
('Russian Twist','التواء روسي','core','bodyweight','https://www.youtube.com/watch?v=wkD8rjkodUI'),
('Dead Bug','ديد باج','core','bodyweight','https://www.youtube.com/watch?v=rbemelnkHag'),
('Treadmill Run','جري على المشاية','cardio','machine',null),
('Stationary Bike','دراجة ثابتة','cardio','machine',null),
('Rowing Machine','جهاز التجديف','cardio','machine',null),
('Jump Rope','نط الحبل','cardio','bodyweight','https://www.youtube.com/watch?v=u3zgHI8QnqE'),
('Burpee','بيربي','full_body','bodyweight','https://www.youtube.com/watch?v=TU8QYVW0gDU'),
('Kettlebell Swing','أرجحة الكيتل بيل','full_body','kettlebell','https://www.youtube.com/watch?v=YSxHifyI6s8'),
('Mountain Climber','تسلق الجبل','full_body','bodyweight','https://www.youtube.com/watch?v=nmwgirgXLYM')
on conflict do nothing;
