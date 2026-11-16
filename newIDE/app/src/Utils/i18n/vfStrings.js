// @flow
// Свои надписи VoxForge на всех языках интерфейса.
// Ключ — русская строка (так её видно прямо в коде). Нет перевода — покажется
// английский, а для русского — сама строка.
import * as React from 'react';

const LANGUAGES = ['en', 'de', 'uk', 'pl', 'es', 'fr', 'tr', 'pt', 'ko'];

// Строка: [русский, en, de, uk, pl, es, fr, tr, pt, ko]
const ROWS: Array<Array<string>> = [
  ['VoxForge — игровой движок с открытым кодом. Делай 2D и 3D игры и публикуй их для Windows, Android и веба.', 'VoxForge is an open-source game engine. Make 2D and 3D games and publish them for Windows, Android and the web.', 'VoxForge ist eine Open-Source-Spiele-Engine. Erstelle 2D- und 3D-Spiele und veröffentliche sie für Windows, Android und das Web.', 'VoxForge — ігровий рушій з відкритим кодом. Роби 2D і 3D ігри та публікуй їх для Windows, Android і вебу.', 'VoxForge to silnik gier open source. Twórz gry 2D i 3D i publikuj je na Windows, Androida i w sieci.', 'VoxForge es un motor de juegos de código abierto. Crea juegos 2D y 3D y publícalos para Windows, Android y la web.', 'VoxForge est un moteur de jeu open source. Crée des jeux 2D et 3D et publie-les pour Windows, Android et le web.', 'VoxForge açık kaynaklı bir oyun motorudur. 2D ve 3D oyunlar yap, Windows, Android ve web için yayınla.', 'VoxForge é um motor de jogos de código aberto. Crie jogos 2D e 3D e publique para Windows, Android e web.', 'VoxForge는 오픈소스 게임 엔진입니다. 2D·3D 게임을 만들어 Windows, Android, 웹으로 배포하세요.'],
  ['(лицензия MIT). GDevelop создал Флориан «4ian» Рив, ниже — люди, которые вложились в исходный проект.', '(MIT license). GDevelop was created by Florian “4ian” Rival; below are the people who contributed to the original project.', '(MIT-Lizenz). GDevelop wurde von Florian „4ian“ Rival erschaffen; unten stehen die Menschen, die zum Originalprojekt beigetragen haben.', '(ліцензія MIT). GDevelop створив Флоріан «4ian» Рівал, нижче — люди, які долучилися до вихідного проєкту.', '(licencja MIT). GDevelop stworzył Florian „4ian” Rival; poniżej osoby, które wniosły wkład w oryginalny projekt.', '(licencia MIT). GDevelop fue creado por Florian «4ian» Rival; abajo están las personas que contribuyeron al proyecto original.', '(licence MIT). GDevelop a été créé par Florian « 4ian » Rival ; ci-dessous, les personnes qui ont contribué au projet d’origine.', '(MIT lisansı). GDevelop’u Florian “4ian” Rival yarattı; aşağıda özgün projeye katkıda bulunanlar var.', '(licença MIT). O GDevelop foi criado por Florian “4ian” Rival; abaixo estão as pessoas que contribuíram para o projeto original.', '(MIT 라이선스). GDevelop은 Florian “4ian” Rival이 만들었으며, 아래는 원본 프로젝트에 기여한 사람들입니다.'],
  ['VoxForge построен на открытом движке GDevelop', 'VoxForge is built on the open-source engine GDevelop', 'VoxForge basiert auf der Open-Source-Engine GDevelop', 'VoxForge побудовано на відкритому рушії GDevelop', 'VoxForge jest zbudowany na otwartym silniku GDevelop', 'VoxForge está construido sobre el motor abierto GDevelop', 'VoxForge est construit sur le moteur ouvert GDevelop', 'VoxForge açık kaynaklı GDevelop motoru üzerine kuruludur', 'O VoxForge é construído sobre o motor aberto GDevelop', 'VoxForge는 오픈소스 엔진 GDevelop을 기반으로 합니다'],
  ['Версия:', 'Version:', 'Version:', 'Версія:', 'Wersja:', 'Versión:', 'Version :', 'Sürüm:', 'Versão:', '버전:'],
  ['Название', 'Name', 'Name', 'Назва', 'Nazwa', 'Nombre', 'Nom', 'Ad', 'Nome', '이름'],
  ['Хранение', 'Storage', 'Speicherort', 'Зберігання', 'Przechowywanie', 'Almacenamiento', 'Stockage', 'Depolama', 'Armazenamento', '저장 위치'],
  ['Открыть в VS Code', 'Open in VS Code', 'In VS Code öffnen', 'Відкрити у VS Code', 'Otwórz w VS Code', 'Abrir en VS Code', 'Ouvrir dans VS Code', 'VS Code’da aç', 'Abrir no VS Code', 'VS Code에서 열기'],
  ['Собрать EXE', 'Build EXE', 'EXE erstellen', 'Зібрати EXE', 'Zbuduj EXE', 'Crear EXE', 'Créer l’EXE', 'EXE oluştur', 'Gerar EXE', 'EXE 빌드'],
  ['Собрать APK', 'Build APK', 'APK erstellen', 'Зібрати APK', 'Zbuduj APK', 'Crear APK', 'Créer l’APK', 'APK oluştur', 'Gerar APK', 'APK 빌드'],
  ['Сборщик VoxForge на этом компьютере', 'VoxForge builder on this computer', 'VoxForge-Builder auf diesem Computer', 'Збирач VoxForge на цьому комп’ютері', 'Builder VoxForge na tym komputerze', 'Compilador VoxForge en este equipo', 'Compilateur VoxForge sur cet ordinateur', 'Bu bilgisayardaki VoxForge derleyicisi', 'Compilador VoxForge neste computador', '이 컴퓨터의 VoxForge 빌더'],
  ['Режим кода', 'Code mode', 'Code-Modus', 'Режим коду', 'Tryb kodu', 'Modo código', 'Mode code', 'Kod modu', 'Modo de código', '코드 모드'],
  ['Проекты', 'Projects', 'Projekte', 'Проєкти', 'Projekty', 'Proyectos', 'Projets', 'Projeler', 'Projetos', '프로젝트'],
  ['Обучение', 'Learn', 'Lernen', 'Навчання', 'Nauka', 'Aprender', 'Apprendre', 'Öğren', 'Aprender', '배우기'],
  ['Новая игра', 'New game', 'Neues Spiel', 'Нова гра', 'Nowa gra', 'Nuevo juego', 'Nouveau jeu', 'Yeni oyun', 'Novo jogo', '새 게임'],
  ['Открыть проект', 'Open project', 'Projekt öffnen', 'Відкрити проєкт', 'Otwórz projekt', 'Abrir proyecto', 'Ouvrir un projet', 'Proje aç', 'Abrir projeto', '프로젝트 열기'],
  ['Параметры', 'Settings', 'Einstellungen', 'Параметри', 'Ustawienia', 'Ajustes', 'Réglages', 'Ayarlar', 'Configurações', '설정'],
  ['Экспорт', 'Export', 'Exportieren', 'Експорт', 'Eksport', 'Exportar', 'Exporter', 'Dışa aktar', 'Exportar', '내보내기'],
  ['Создать проект', 'Create project', 'Projekt erstellen', 'Створити проєкт', 'Utwórz projekt', 'Crear proyecto', 'Créer un projet', 'Proje oluştur', 'Criar projeto', '프로젝트 만들기'],
  ['Что создаём?', 'What are we making?', 'Was erstellen wir?', 'Що створюємо?', 'Co tworzymy?', '¿Qué creamos?', 'Que créons-nous ?', 'Ne yapıyoruz?', 'O que vamos criar?', '무엇을 만들까요?'],
  ['Игра', 'Game', 'Spiel', 'Гра', 'Gra', 'Juego', 'Jeu', 'Oyun', 'Jogo', '게임'],
  ['Приложение', 'App', 'App', 'Застосунок', 'Aplikacja', 'Aplicación', 'Application', 'Uygulama', 'Aplicativo', '앱'],
  ['2D и 3D, для Windows, Android и веба. Начни с шаблона или с пустой сцены.', '2D and 3D, for Windows, Android and the web. Start from a template or an empty scene.', '2D und 3D, für Windows, Android und das Web. Starte mit einer Vorlage oder einer leeren Szene.', '2D і 3D, для Windows, Android і вебу. Почни з шаблону або з порожньої сцени.', '2D i 3D, na Windows, Androida i web. Zacznij od szablonu lub pustej sceny.', '2D y 3D, para Windows, Android y la web. Empieza con una plantilla o una escena vacía.', '2D et 3D, pour Windows, Android et le web. Commence avec un modèle ou une scène vide.', '2D ve 3D; Windows, Android ve web için. Bir şablonla veya boş bir sahneyle başla.', '2D e 3D, para Windows, Android e web. Comece com um modelo ou uma cena vazia.', '2D·3D, Windows, Android, 웹용. 템플릿이나 빈 장면으로 시작하세요.'],
  ['Приложения для телефона и ПК на том же редакторе. Скоро.', 'Phone and PC apps in the same editor. Coming soon.', 'Handy- und PC-Apps im selben Editor. Bald verfügbar.', 'Застосунки для телефона і ПК в тому ж редакторі. Скоро.', 'Aplikacje na telefon i PC w tym samym edytorze. Wkrótce.', 'Aplicaciones para móvil y PC en el mismo editor. Próximamente.', 'Applications mobiles et PC dans le même éditeur. Bientôt.', 'Aynı düzenleyicide telefon ve PC uygulamaları. Yakında.', 'Aplicativos para celular e PC no mesmo editor. Em breve.', '같은 에디터로 만드는 모바일·PC 앱. 곧 제공됩니다.'],
  ['Отмена', 'Cancel', 'Abbrechen', 'Скасувати', 'Anuluj', 'Cancelar', 'Annuler', 'İptal', 'Cancelar', '취소'],
  ['Скоро', 'Soon', 'Bald', 'Скоро', 'Wkrótce', 'Pronto', 'Bientôt', 'Yakında', 'Em breve', '곧'],
  ['Создать', 'Create', 'Erstellen', 'Створити', 'Utwórz', 'Crear', 'Créer', 'Oluştur', 'Criar', '만들기'],
  ['Раскладка редактора', 'Editor layout', 'Editor-Layout', 'Розкладка редактора', 'Układ edytora', 'Distribución del editor', "Disposition de l'éditeur", 'Düzenleyici yerleşimi', 'Layout do editor', '에디터 레이아웃'],
  ['Объекты', 'Objects', 'Objekte', "Об'єкти", 'Obiekty', 'Objetos', 'Objets', 'Nesneler', 'Objetos', '오브젝트'],
  ['Группы объектов', 'Object groups', 'Objektgruppen', "Групи об'єктів", 'Grupy obiektów', 'Grupos de objetos', "Groupes d'objets", 'Nesne grupları', 'Grupos de objetos', '오브젝트 그룹'],
  ['Инспектор', 'Inspector', 'Inspektor', 'Інспектор', 'Inspektor', 'Inspector', 'Inspecteur', 'Denetçi', 'Inspetor', '인스펙터'],
  ['Экземпляры', 'Instances', 'Instanzen', 'Екземпляри', 'Instancje', 'Instancias', 'Instances', 'Örnekler', 'Instâncias', '인스턴스'],
  ['Слои', 'Layers', 'Ebenen', 'Шари', 'Warstwy', 'Capas', 'Calques', 'Katmanlar', 'Camadas', '레이어'],
  ['Сбросить раскладку', 'Reset layout', 'Layout zurücksetzen', 'Скинути розкладку', 'Zresetuj układ', 'Restablecer distribución', 'Réinitialiser la disposition', 'Yerleşimi sıfırla', 'Redefinir layout', '레이아웃 초기화'],
  ['Как в Unity', 'Like Unity', 'Wie in Unity', 'Як у Unity', 'Jak w Unity', 'Como en Unity', 'Comme Unity', 'Unity gibi', 'Como no Unity', 'Unity 스타일'],
  ['С нижней панелью', 'With bottom panel', 'Mit unterem Panel', 'З нижньою панеллю', 'Z dolnym panelem', 'Con panel inferior', 'Avec panneau du bas', 'Alt panelli', 'Com painel inferior', '하단 패널 포함'],
  ['Широкая сцена', 'Wide scene', 'Breite Szene', 'Широка сцена', 'Szeroka scena', 'Escena amplia', 'Scène large', 'Geniş sahne', 'Cena ampla', '넓은 장면'],
  ['Классика', 'Classic', 'Klassisch', 'Класика', 'Klasyczny', 'Clásico', 'Classique', 'Klasik', 'Clássico', '클래식'],
  ['Проектов пока нет', 'No projects yet', 'Noch keine Projekte', 'Проєктів поки немає', 'Brak projektów', 'Aún no hay proyectos', 'Aucun projet pour le moment', 'Henüz proje yok', 'Ainda não há projetos', '아직 프로젝트가 없습니다'],
  ['Создай первый проект: выбери тип и шаблон, остальное подскажет редактор.', 'Create your first project: pick a type and a template, the editor will guide you from there.', 'Erstelle dein erstes Projekt: Wähle Typ und Vorlage, den Rest zeigt dir der Editor.', 'Створи перший проєкт: обери тип і шаблон, решту підкаже редактор.', 'Utwórz pierwszy projekt: wybierz typ i szablon, resztę podpowie edytor.', 'Crea tu primer proyecto: elige un tipo y una plantilla, el editor te guiará.', "Crée ton premier projet : choisis un type et un modèle, l'éditeur te guidera.", 'İlk projeni oluştur: bir tür ve şablon seç, gerisini düzenleyici gösterir.', 'Crie seu primeiro projeto: escolha o tipo e um modelo, o editor guia você.', '첫 프로젝트를 만들어 보세요. 종류와 템플릿을 고르면 나머지는 에디터가 안내합니다.'],
  ['Без названия', 'Untitled', 'Ohne Titel', 'Без назви', 'Bez nazwy', 'Sin título', 'Sans titre', 'Adsız', 'Sem título', '이름 없음'],
  ['Профиль', 'Profile', 'Profil', 'Профіль', 'Profil', 'Perfil', 'Profil', 'Profil', 'Perfil', '프로필'],
  ['Закрыть', 'Close', 'Schließen', 'Закрити', 'Zamknij', 'Cerrar', 'Fermer', 'Kapat', 'Fechar', '닫기'],
  ['Выйти', 'Log out', 'Abmelden', 'Вийти', 'Wyloguj', 'Cerrar sesión', 'Se déconnecter', 'Çıkış yap', 'Sair', '로그아웃'],
  ['Войти', 'Log in', 'Anmelden', 'Увійти', 'Zaloguj', 'Iniciar sesión', 'Se connecter', 'Giriş yap', 'Entrar', '로그인'],
  ['Без имени', 'No name', 'Ohne Namen', "Без імені", 'Bez nazwy', 'Sin nombre', 'Sans nom', 'İsimsiz', 'Sem nome', '이름 없음'],
  ['Номер аккаунта', 'Account number', 'Kontonummer', 'Номер акаунта', 'Numer konta', 'Número de cuenta', 'Numéro de compte', 'Hesap numarası', 'Número da conta', '계정 번호'],
  ['Скопировано', 'Copied', 'Kopiert', 'Скопійовано', 'Skopiowano', 'Copiado', 'Copié', 'Kopyalandı', 'Copiado', '복사됨'],
  ['Копировать', 'Copy', 'Kopieren', 'Копіювати', 'Kopiuj', 'Copiar', 'Copier', 'Kopyala', 'Copiar', '복사'],
  ['Почта', 'Email', 'E-Mail', 'Пошта', 'E-mail', 'Correo', 'E-mail', 'E-posta', 'E-mail', '이메일'],
  ['подтверждена', 'verified', 'bestätigt', 'підтверджена', 'potwierdzony', 'verificado', 'vérifié', 'doğrulandı', 'verificado', '인증됨'],
  ['не подтверждена', 'not verified', 'nicht bestätigt', 'не підтверджена', 'niepotwierdzony', 'sin verificar', 'non vérifié', 'doğrulanmadı', 'não verificado', '미인증'],
  ['Управление аккаунтом', 'Manage account', 'Konto verwalten', 'Керування акаунтом', 'Zarządzaj kontem', 'Gestionar cuenta', 'Gérer le compte', 'Hesabı yönet', 'Gerenciar conta', '계정 관리'],
  ['Не удалось войти', 'Could not log in', 'Anmeldung fehlgeschlagen', 'Не вдалося увійти', 'Nie udało się zalogować', 'No se pudo iniciar sesión', 'Connexion impossible', 'Giriş yapılamadı', 'Não foi possível entrar', '로그인하지 못했습니다'],
  ['Вход ещё настраивается', 'Login is still being set up', 'Anmeldung wird noch eingerichtet', 'Вхід ще налаштовується', 'Logowanie jest jeszcze konfigurowane', 'El inicio de sesión aún se está configurando', 'La connexion est en cours de configuration', 'Giriş henüz ayarlanıyor', 'O login ainda está sendo configurado', '로그인을 아직 설정 중입니다'],
  ['Сервис входа запущен, но проект ещё не подключён к Quorvox ID. Попробуй позже.', 'The login service is running, but this project is not connected to Quorvox ID yet. Try again later.', 'Der Anmeldedienst läuft, aber das Projekt ist noch nicht mit Quorvox ID verbunden. Versuche es später erneut.', 'Сервіс входу запущено, але проєкт ще не підключено до Quorvox ID. Спробуй пізніше.', 'Usługa logowania działa, ale projekt nie jest jeszcze połączony z Quorvox ID. Spróbuj później.', 'El servicio de acceso funciona, pero el proyecto aún no está conectado a Quorvox ID. Inténtalo más tarde.', "Le service de connexion fonctionne, mais le projet n'est pas encore relié à Quorvox ID. Réessaie plus tard.", 'Giriş hizmeti çalışıyor ama proje henüz Quorvox ID’ye bağlı değil. Sonra tekrar dene.', 'O serviço de login está ativo, mas o projeto ainda não está conectado ao Quorvox ID. Tente mais tarde.', '로그인 서비스는 실행 중이지만 프로젝트가 아직 Quorvox ID에 연결되지 않았습니다. 나중에 다시 시도하세요.'],
  ['Сервис входа недоступен', 'Login service unavailable', 'Anmeldedienst nicht erreichbar', 'Сервіс входу недоступний', 'Usługa logowania niedostępna', 'Servicio de acceso no disponible', 'Service de connexion indisponible', 'Giriş hizmeti kullanılamıyor', 'Serviço de login indisponível', '로그인 서비스를 사용할 수 없습니다'],
  ['Не получилось связаться с сервисом входа. Попробуй позже.', 'Could not reach the login service. Try again later.', 'Der Anmeldedienst ist nicht erreichbar. Versuche es später erneut.', 'Не вдалося зв’язатися із сервісом входу. Спробуй пізніше.', 'Nie udało się połączyć z usługą logowania. Spróbuj później.', 'No se pudo contactar con el servicio de acceso. Inténtalo más tarde.', 'Impossible de joindre le service de connexion. Réessaie plus tard.', 'Giriş hizmetine ulaşılamadı. Sonra tekrar dene.', 'Não foi possível contactar o serviço de login. Tente mais tarde.', '로그인 서비스에 연결하지 못했습니다. 나중에 다시 시도하세요.'],
  ['Уроки VoxForge скоро появятся', 'VoxForge lessons are coming soon', 'VoxForge-Lektionen kommen bald', 'Уроки VoxForge скоро з’являться', 'Lekcje VoxForge już wkrótce', 'Las lecciones de VoxForge llegarán pronto', 'Les leçons VoxForge arrivent bientôt', 'VoxForge dersleri yakında geliyor', 'As aulas do VoxForge chegam em breve', 'VoxForge 강의가 곧 제공됩니다'],
  ['Курсы по программированию', 'Programming courses', 'Programmierkurse', 'Курси програмування', 'Kursy programowania', 'Cursos de programación', 'Cours de programmation', 'Programlama kursları', 'Cursos de programação', '프로그래밍 강좌'],
  ['Курс по Python', 'Python course', 'Python-Kurs', 'Курс з Python', 'Kurs Pythona', 'Curso de Python', 'Cours de Python', 'Python kursu', 'Curso de Python', '파이썬 강좌'],
  ['Бесплатный курс от команды Quorvox: с нуля до своих программ.', 'A free course from the Quorvox team: from zero to your own programs.', 'Ein kostenloser Kurs vom Quorvox-Team: von null bis zu eigenen Programmen.', 'Безкоштовний курс від команди Quorvox: з нуля до власних програм.', 'Darmowy kurs od zespołu Quorvox: od zera do własnych programów.', 'Un curso gratuito del equipo Quorvox: de cero a tus propios programas.', "Un cours gratuit de l'équipe Quorvox : de zéro à tes propres programmes.", 'Quorvox ekibinden ücretsiz kurs: sıfırdan kendi programlarına.', 'Um curso gratuito da equipe Quorvox: do zero aos seus próprios programas.', 'Quorvox 팀의 무료 강좌: 처음부터 나만의 프로그램까지.'],
  ['Работа с движком', 'Using the engine', 'Arbeiten mit der Engine', 'Робота з рушієм', 'Praca z silnikiem', 'Trabajar con el motor', 'Utiliser le moteur', 'Motoru kullanma', 'Usando o motor', '엔진 사용하기'],
  ['Первая игра за вечер: сцены, объекты, события и запуск.', 'Your first game in an evening: scenes, objects, events and running it.', 'Dein erstes Spiel an einem Abend: Szenen, Objekte, Ereignisse und Start.', 'Перша гра за вечір: сцени, об’єкти, події та запуск.', 'Pierwsza gra w jeden wieczór: sceny, obiekty, zdarzenia i uruchomienie.', 'Tu primer juego en una tarde: escenas, objetos, eventos y ejecución.', 'Ton premier jeu en une soirée : scènes, objets, évènements et lancement.', 'Bir akşamda ilk oyunun: sahneler, nesneler, olaylar ve çalıştırma.', 'Seu primeiro jogo em uma noite: cenas, objetos, eventos e execução.', '하룻저녁에 만드는 첫 게임: 장면, 오브젝트, 이벤트, 실행.'],
  ['Открыть', 'Open', 'Öffnen', 'Відкрити', 'Otwórz', 'Abrir', 'Ouvrir', 'Aç', 'Abrir', '열기'],
  ['Создать проект из шаблона', 'Create a project from a template', 'Projekt aus Vorlage erstellen', 'Створити проєкт із шаблону', 'Utwórz projekt z szablonu', 'Crear proyecto desde plantilla', 'Créer un projet depuis un modèle', 'Şablondan proje oluştur', 'Criar projeto de um modelo', '템플릿으로 프로젝트 만들기'],
  ['Сайт VoxForge', 'VoxForge website', 'VoxForge-Website', 'Сайт VoxForge', 'Strona VoxForge', 'Sitio de VoxForge', 'Site de VoxForge', 'VoxForge sitesi', 'Site do VoxForge', 'VoxForge 웹사이트'],
  ['Команда Quorvox на GitHub', 'Quorvox team on GitHub', 'Quorvox-Team auf GitHub', 'Команда Quorvox на GitHub', 'Zespół Quorvox na GitHubie', 'Equipo Quorvox en GitHub', "L'équipe Quorvox sur GitHub", 'GitHub’da Quorvox ekibi', 'Equipe Quorvox no GitHub', 'GitHub의 Quorvox 팀'],
  ['Собери игру. Выпусти её везде.', 'Build a game. Ship it everywhere.', 'Baue ein Spiel. Veröffentliche es überall.', 'Збери гру. Випусти її всюди.', 'Zbuduj grę. Wydaj ją wszędzie.', 'Crea un juego. Publícalo en todas partes.', 'Crée un jeu. Publie-le partout.', 'Bir oyun yap. Her yerde yayınla.', 'Crie um jogo. Publique em qualquer lugar.', '게임을 만들고 어디서든 배포하세요.'],
  ['О программе', 'About', 'Über', 'Про програму', 'O programie', 'Acerca de', 'À propos', 'Hakkında', 'Sobre', '정보'],
  ['Основа', 'Foundation', 'Grundlage', 'Основа', 'Podstawa', 'Base', 'Base', 'Temel', 'Base', '기반'],
  ['Версия', 'Version', 'Version', 'Версія', 'Wersja', 'Versión', 'Version', 'Sürüm', 'Versão', '버전'],
  ['Обновления', 'Updates', 'Updates', 'Оновлення', 'Aktualizacje', 'Actualizaciones', 'Mises à jour', 'Güncellemeler', 'Atualizações', '업데이트'],
  ['Сведений об обновлениях нет.', 'No update information.', 'Keine Update-Informationen.', 'Відомостей про оновлення немає.', 'Brak informacji o aktualizacjach.', 'No hay información de actualizaciones.', 'Aucune information de mise à jour.', 'Güncelleme bilgisi yok.', 'Sem informações de atualização.', '업데이트 정보가 없습니다.'],
  ['Исходный проект GDevelop', 'Original GDevelop project', 'Ursprüngliches GDevelop-Projekt', 'Вихідний проєкт GDevelop', 'Oryginalny projekt GDevelop', 'Proyecto original GDevelop', 'Projet GDevelop original', 'Orijinal GDevelop projesi', 'Projeto GDevelop original', '원본 GDevelop 프로젝트'],
  ['В браузере на этом компьютере', 'In the browser on this computer', 'Im Browser auf diesem Computer', 'У браузері на цьому комп’ютері', 'W przeglądarce na tym komputerze', 'En el navegador de este equipo', 'Dans le navigateur de cet ordinateur', 'Bu bilgisayardaki tarayıcıda', 'No navegador deste computador', '이 컴퓨터의 브라우저'],
  ['Папка на компьютере (файлы для VS Code)', 'Folder on this computer (files for VS Code)', 'Ordner auf dem Computer (Dateien für VS Code)', 'Тека на комп’ютері (файли для VS Code)', 'Folder na komputerze (pliki dla VS Code)', 'Carpeta en el equipo (archivos para VS Code)', "Dossier sur l'ordinateur (fichiers pour VS Code)", 'Bilgisayarda klasör (VS Code dosyaları)', 'Pasta no computador (arquivos para VS Code)', '컴퓨터의 폴더 (VS Code용 파일)'],
  ['Папка не выбрана. Выбери пустую папку для проекта.', 'No folder selected. Pick an empty folder for the project.', 'Kein Ordner gewählt. Wähle einen leeren Ordner für das Projekt.', 'Теку не вибрано. Обери порожню теку для проєкту.', 'Nie wybrano folderu. Wybierz pusty folder dla projektu.', 'No hay carpeta. Elige una carpeta vacía para el proyecto.', 'Aucun dossier choisi. Choisis un dossier vide pour le projet.', 'Klasör seçilmedi. Proje için boş bir klasör seç.', 'Nenhuma pasta escolhida. Escolha uma pasta vazia para o projeto.', '폴더가 선택되지 않았습니다. 프로젝트용 빈 폴더를 고르세요.'],
  ['Другая папка…', 'Another folder…', 'Anderer Ordner …', 'Інша тека…', 'Inny folder…', 'Otra carpeta…', 'Autre dossier…', 'Başka klasör…', 'Outra pasta…', '다른 폴더…'],
  ['Выбрать папку…', 'Choose folder…', 'Ordner wählen …', 'Обрати теку…', 'Wybierz folder…', 'Elegir carpeta…', 'Choisir un dossier…', 'Klasör seç…', 'Escolher pasta…', '폴더 선택…'],
  ['Папка', 'Folder', 'Ordner', 'Тека', 'Folder', 'Carpeta', 'Dossier', 'Klasör', 'Pasta', '폴더'],
  ['Тема', 'Theme', 'Design', 'Тема', 'Motyw', 'Tema', 'Thème', 'Tema', 'Tema', '테마'],
  ['Цвет акцента', 'Accent color', 'Akzentfarbe', 'Колір акценту', 'Kolor akcentu', 'Color de acento', "Couleur d'accent", 'Vurgu rengi', 'Cor de destaque', '강조 색상'],
  ['Оранжевый', 'Orange', 'Orange', 'Помаранчевий', 'Pomarańczowy', 'Naranja', 'Orange', 'Turuncu', 'Laranja', '주황'],
  ['Синий', 'Blue', 'Blau', 'Синій', 'Niebieski', 'Azul', 'Bleu', 'Mavi', 'Azul', '파랑'],
  ['Зелёный', 'Green', 'Grün', 'Зелений', 'Zielony', 'Verde', 'Vert', 'Yeşil', 'Verde', '초록'],
  ['Фиолетовый', 'Purple', 'Violett', 'Фіолетовий', 'Fioletowy', 'Morado', 'Violet', 'Mor', 'Roxo', '보라'],
  ['Розовый', 'Pink', 'Pink', 'Рожевий', 'Różowy', 'Rosa', 'Rose', 'Pembe', 'Rosa', '분홍'],
  ['Красный', 'Red', 'Rot', 'Червоний', 'Czerwony', 'Rojo', 'Rouge', 'Kırmızı', 'Vermelho', '빨강'],
  ['Бирюзовый', 'Teal', 'Türkis', 'Бірюзовий', 'Turkusowy', 'Turquesa', 'Turquoise', 'Turkuaz', 'Turquesa', '청록'],
];

const TABLE: { [lang: string]: { [ru: string]: string } } = {};
LANGUAGES.forEach((lang, index) => {
  const dictionary = {};
  ROWS.forEach(row => {
    dictionary[row[0]] = row[index + 1];
  });
  TABLE[lang] = dictionary;
});

let currentLanguage = 'ru';
const listeners: Set<() => void> = new Set();

/** Код вида ru_RU / pt-BR → короткий код (ru, pt, ko…). */
const toShortCode = (language: string): string =>
  (language || 'en')
    .toLowerCase()
    .split(/[-_]/)[0];

/** Вызывается при смене языка интерфейса (из GDI18nProvider). */
export const setVfLanguage = (language: string) => {
  const short = toShortCode(language);
  if (short === currentLanguage) return;
  currentLanguage = short;
  listeners.forEach(listener => listener());
};

/** Подписка: компонент перерисуется, когда язык сменится. */
export const useVfLanguage = (): string => {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const listener = () => setTick(tick => tick + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return currentLanguage;
};

/** Перевод русской строки на текущий язык интерфейса. */
export const vf = (russian: string): string => {
  if (currentLanguage === 'ru') return russian;
  const dictionary = TABLE[currentLanguage] || TABLE.en;
  return dictionary[russian] || TABLE.en[russian] || russian;
};
