-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Masters (business cards)
CREATE TABLE public.masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  kind text NOT NULL CHECK (kind IN ('tea', 'coffee')),
  name text NOT NULL,
  title text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  workplace text NOT NULL DEFAULT '',
  years_experience integer NOT NULL DEFAULT 0 CHECK (years_experience >= 0 AND years_experience <= 80),
  bio text NOT NULL DEFAULT '',
  avatar_url text,
  card_style text NOT NULL DEFAULT 'classic' CHECK (card_style IN ('classic', 'gold', 'noir', 'pearl')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.masters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.masters TO authenticated;
GRANT ALL ON public.masters TO service_role;
ALTER TABLE public.masters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Masters are public" ON public.masters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Create own master card" ON public.masters FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own master card" ON public.masters FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own master card" ON public.masters FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.owns_master(_master_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.masters WHERE id = _master_id AND user_id = auth.uid())
$$;

-- Achievements
CREATE TABLE public.master_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid NOT NULL REFERENCES public.masters(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'championship' CHECK (category IN ('championship', 'award', 'certificate', 'other')),
  place text NOT NULL DEFAULT '',
  year integer,
  description text NOT NULL DEFAULT '',
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.master_achievements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_achievements TO authenticated;
GRANT ALL ON public.master_achievements TO service_role;
ALTER TABLE public.master_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are public" ON public.master_achievements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owner adds achievements" ON public.master_achievements FOR INSERT TO authenticated WITH CHECK (public.owns_master(master_id));
CREATE POLICY "Owner or admin updates achievements" ON public.master_achievements FOR UPDATE TO authenticated
  USING (public.owns_master(master_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner deletes achievements" ON public.master_achievements FOR DELETE TO authenticated USING (public.owns_master(master_id));

-- Signature drinks
CREATE TABLE public.master_drinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid NOT NULL REFERENCES public.masters(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.master_drinks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_drinks TO authenticated;
GRANT ALL ON public.master_drinks TO service_role;
ALTER TABLE public.master_drinks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drinks are public" ON public.master_drinks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owner adds drinks" ON public.master_drinks FOR INSERT TO authenticated WITH CHECK (public.owns_master(master_id));
CREATE POLICY "Owner updates drinks" ON public.master_drinks FOR UPDATE TO authenticated USING (public.owns_master(master_id));
CREATE POLICY "Owner deletes drinks" ON public.master_drinks FOR DELETE TO authenticated USING (public.owns_master(master_id));

-- Recommended cafes
CREATE TABLE public.master_cafes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid NOT NULL REFERENCES public.masters(id) ON DELETE CASCADE,
  name text NOT NULL,
  city text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.master_cafes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_cafes TO authenticated;
GRANT ALL ON public.master_cafes TO service_role;
ALTER TABLE public.master_cafes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cafes are public" ON public.master_cafes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owner adds cafes" ON public.master_cafes FOR INSERT TO authenticated WITH CHECK (public.owns_master(master_id));
CREATE POLICY "Owner updates cafes" ON public.master_cafes FOR UPDATE TO authenticated USING (public.owns_master(master_id));
CREATE POLICY "Owner deletes cafes" ON public.master_cafes FOR DELETE TO authenticated USING (public.owns_master(master_id));

-- Peer recognition (one master about another)
CREATE TABLE public.peer_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid NOT NULL REFERENCES public.masters(id) ON DELETE CASCADE,
  author_master_id uuid NOT NULL REFERENCES public.masters(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (master_id, author_master_id),
  CHECK (master_id <> author_master_id)
);
GRANT SELECT ON public.peer_endorsements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peer_endorsements TO authenticated;
GRANT ALL ON public.peer_endorsements TO service_role;
ALTER TABLE public.peer_endorsements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Endorsements are public" ON public.peer_endorsements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Masters endorse colleagues" ON public.peer_endorsements FOR INSERT TO authenticated WITH CHECK (public.owns_master(author_master_id));
CREATE POLICY "Author edits endorsement" ON public.peer_endorsements FOR UPDATE TO authenticated USING (public.owns_master(author_master_id));
CREATE POLICY "Author deletes endorsement" ON public.peer_endorsements FOR DELETE TO authenticated USING (public.owns_master(author_master_id));

-- Guest reviews
CREATE TABLE public.guest_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid NOT NULL REFERENCES public.masters(id) ON DELETE CASCADE,
  author_id uuid,
  author_name text NOT NULL DEFAULT 'Гость',
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.guest_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_reviews TO authenticated;
GRANT ALL ON public.guest_reviews TO service_role;
ALTER TABLE public.guest_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are public" ON public.guest_reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Guests leave reviews" ON public.guest_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND NOT public.owns_master(master_id));
CREATE POLICY "Author deletes review" ON public.guest_reviews FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Follows
CREATE TABLE public.follows (
  follower_id uuid NOT NULL,
  master_id uuid NOT NULL REFERENCES public.masters(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, master_id)
);
GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are public" ON public.follows FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Follow as self" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Unfollow as self" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER masters_touch BEFORE UPDATE ON public.masters FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Avatars storage policies (bucket created separately, private; read via long-lived signed URLs)
CREATE POLICY "Avatars readable" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');
CREATE POLICY "Avatar upload own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatar update own folder" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatar delete own folder" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Demo masters
INSERT INTO public.masters (id, kind, name, title, city, workplace, years_experience, bio, card_style) VALUES
('a0000000-0000-4000-8000-000000000001', 'coffee', 'Алина Воронцова', 'Шеф-бариста', 'Москва', 'Кофейня «Зерно и пар»', 9, 'Работаю с эспрессо с 2016 года. Люблю светлую обжарку Эфиопии и честные молочные напитки без сиропов.', 'classic'),
('a0000000-0000-4000-8000-000000000002', 'coffee', 'Тимур Галиев', 'Бариста-чемпион, тренер', 'Казань', 'Roastery 43', 12, 'Тренирую барист, сужу чемпионаты, обжариваю сам. Каждую чашку считаю маленьким выступлением.', 'gold'),
('a0000000-0000-4000-8000-000000000003', 'coffee', 'Марина Ли', 'Бариста, латте-арт', 'Санкт-Петербург', 'Café Nord', 5, 'Латте-арт — мой язык. Рисую лебедей, тюльпаны и иногда — портреты гостей.', 'noir'),
('a0000000-0000-4000-8000-000000000004', 'tea', 'Аркадий Сун', 'Чайный мастер', 'Москва', 'Чайный дом «Тишина»', 15, 'Пятнадцать лет с пуэрами и улунами. Провожу гунфу-ча для тех, кто готов замедлиться.', 'classic'),
('a0000000-0000-4000-8000-000000000005', 'tea', 'Вера Ким', 'Сомелье чая', 'Владивосток', 'Teaborn', 7, 'Собираю чай напрямую с ферм Фуцзяни и Тайваня. Ставлю чайные сеты к ужину.', 'pearl'),
('a0000000-0000-4000-8000-000000000006', 'tea', 'Даниил Орлов', 'Мастер чайной церемонии', 'Екатеринбург', 'Чайная «Облако»', 4, 'Начинал с бариста, ушёл в чай. Готовлю матчу и придумываю чайные коктейли.', 'gold');

INSERT INTO public.master_achievements (master_id, title, category, place, year, description, verified) VALUES
('a0000000-0000-4000-8000-000000000001', 'Russian Barista Championship', 'championship', 'Финалист', 2023, 'Топ-6 национального чемпионата.', true),
('a0000000-0000-4000-8000-000000000001', 'Курс SCA Barista Skills Professional', 'certificate', '', 2021, '', true),
('a0000000-0000-4000-8000-000000000001', 'Лучший сезонный напиток города', 'award', '1 место', 2024, 'Голосование гостей фестиваля.', false),
('a0000000-0000-4000-8000-000000000002', 'Russian Barista Championship', 'championship', '1 место', 2022, '', true),
('a0000000-0000-4000-8000-000000000002', 'World Barista Championship', 'championship', 'Участник', 2022, 'Представлял Россию.', true),
('a0000000-0000-4000-8000-000000000002', 'Сертифицированный судья', 'certificate', '', 2023, '', false),
('a0000000-0000-4000-8000-000000000003', 'Latte Art Throwdown СПб', 'championship', '2 место', 2024, '', true),
('a0000000-0000-4000-8000-000000000004', 'Всероссийский чайный чемпионат', 'championship', '1 место', 2019, 'Номинация «Гунфу-ча».', true),
('a0000000-0000-4000-8000-000000000004', 'Стажировка на фабрике Мэнхай', 'certificate', '', 2017, '', false),
('a0000000-0000-4000-8000-000000000005', 'Tea Masters Cup Russia', 'championship', '3 место', 2023, '', true),
('a0000000-0000-4000-8000-000000000006', 'Конкурс чайных коктейлей', 'championship', 'Финалист', 2024, '', false);

INSERT INTO public.master_drinks (master_id, name, description) VALUES
('a0000000-0000-4000-8000-000000000001', 'Флэт уайт «Северный»', 'Эфиопия, овсяное молоко, щепоть морской соли.'),
('a0000000-0000-4000-8000-000000000001', 'Эспрессо-тоник с облепихой', 'Яркий, кислый, освежающий.'),
('a0000000-0000-4000-8000-000000000002', 'Сигнатурный «Казанский мёд»', 'Эспрессо, гречишный мёд, сливки на холодной экстракции.'),
('a0000000-0000-4000-8000-000000000003', 'Капучино-портрет', 'Ваш портрет на молочной пене.'),
('a0000000-0000-4000-8000-000000000004', 'Шу пуэр 2008 в гайвани', 'Семь проливов, от земли к сладости.'),
('a0000000-0000-4000-8000-000000000005', 'Улун с грушей и шиповником', 'Холодное заваривание, 12 часов.'),
('a0000000-0000-4000-8000-000000000006', 'Матча-тоник «Облако»', 'Церемониальная матча, тоник, юдзу.');

INSERT INTO public.master_cafes (master_id, name, city, note) VALUES
('a0000000-0000-4000-8000-000000000001', 'Double B', 'Москва', 'За фильтр-кофе по утрам.'),
('a0000000-0000-4000-8000-000000000001', 'Кооператив Чёрный', 'Москва', 'Лучшие эксперименты с обжаркой.'),
('a0000000-0000-4000-8000-000000000002', 'Surf Coffee', 'Казань', 'Атмосфера и скорость.'),
('a0000000-0000-4000-8000-000000000004', 'Чайный клуб «Моган»', 'Москва', 'Редкие пуэры.'),
('a0000000-0000-4000-8000-000000000005', 'Чайная лавка на Светланской', 'Владивосток', 'Тайваньские улуны.');

INSERT INTO public.peer_endorsements (master_id, author_master_id, text) VALUES
('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'Алина — одна из самых внимательных барист, с кем я работал. Её эспрессо всегда стабилен.'),
('a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Тимур научил меня калибровке. Лучший тренер в стране.'),
('a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Самый красивый латте-арт в Питере, без преувеличения.'),
('a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000005', 'Аркадий открыл мне мир выдержанных пуэров.'),
('a0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000004', 'Даниил смело соединяет чай и бар — за этим будущее.');

INSERT INTO public.guest_reviews (master_id, author_name, rating, text) VALUES
('a0000000-0000-4000-8000-000000000001', 'Ольга', 5, 'Хожу только к Алине, она помнит мой заказ и всегда улыбается.'),
('a0000000-0000-4000-8000-000000000001', 'Игорь', 5, 'Эспрессо-тоник с облепихой — лучшее, что я пил этим летом.'),
('a0000000-0000-4000-8000-000000000002', 'Сергей', 5, 'Тимур рассказал про каждое зерно. Как будто побывал на ферме.'),
('a0000000-0000-4000-8000-000000000003', 'Катя', 5, 'Нарисовала мою собаку на капучино!'),
('a0000000-0000-4000-8000-000000000004', 'Михаил', 5, 'Два часа чайной церемонии пролетели как десять минут.'),
('a0000000-0000-4000-8000-000000000005', 'Анна', 4, 'Очень точно подобрала чай под мой ужин.');

-- Only admins may set or change the "verified" flag (added after demo seed on purpose)
CREATE OR REPLACE FUNCTION public.protect_achievement_verified()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.verified := false;
    ELSE
      NEW.verified := OLD.verified;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER achievements_protect_verified BEFORE INSERT OR UPDATE ON public.master_achievements
FOR EACH ROW EXECUTE FUNCTION public.protect_achievement_verified();
