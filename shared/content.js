/*
 * Demo content for the blog prototypes.
 *
 * This file stands in for what the admin panel (CMS) will produce later:
 * posts (stories + opinions) in Bulgarian with an optional English version,
 * and photo albums with captions. Every prototype reads from window.BLOG_CONTENT
 * through the helpers in site.js, so editing this file updates all of them.
 *
 * Body blocks:  { p }  paragraph · { h } subheading · { quote } pull quote ·
 *               { img, caption: {bg, en} } inline photo (file name from /shared/photos)
 */
window.BLOG_CONTENT = {
  site: {
    name: { bg: 'Бъркотия', en: 'Bărkotiya' },
    nameMeaning: { bg: 'бъркотия — хаос, но мил', en: 'bărkotiya — Bulgarian for “a mess”, the nice kind' },
    tagline: {
      bg: 'Красива бъркотия от истории, мнения и снимки.',
      en: 'A beautiful mess of stories, opinions and photos.',
    },
    about: {
      bg: 'Здравей! Тук пиша, когато имам нещо за казване — понякога история, понякога мнение, понякога само снимка. Не обещавам ред. Обещавам искреност и от време на време котка.',
      en: 'Hi! I write here when I have something to say — sometimes a story, sometimes an opinion, sometimes just a photo. I don’t promise order. I promise honesty and the occasional cat.',
    },
  },

  // Newest first.
  posts: [
    {
      slug: 'more-prez-oktomvri',
      type: 'opinion',
      date: '2026-10-12',
      cover: 'sozopol-beach.jpg',
      mood: { bg: 'категорична', en: 'non-negotiable' },
      bg: {
        title: 'Морето през октомври е по-хубаво. Точка.',
        excerpt: 'През юли морето е като сватба, на която не познаваш никого. През октомври е твоето море.',
        body: [
          { p: 'През юли морето е като сватба, на която не познаваш никого: шумно, скъпо и някой винаги ти е настъпил хавлията.' },
          { p: 'През октомври е съвсем друго. Плажът е празен, водата е още топла (добре де, „топла“), продавачите на царевица са си тръгнали и чайките управляват сами.' },
          { h: 'Аргументи, които не подлежат на обсъждане' },
          { p: 'Няма нужда да ставаш в шест, за да запазиш място с чадъра. Можеш да се разхождаш из стария Созопол, без да чакаш на опашка за снимка. А залезът е същият — просто никой не ти пречи да го гледаш.' },
          { img: 'sozopol-beach.jpg', caption: { bg: 'Юли. Виждате ли за какво говоря?', en: 'July. See what I mean?' } },
          { p: 'Единственият минус е, че трябва да носиш пуловер. Но аз нося пуловер и през юли, защото климатиците в автобусите са зли.' },
          { quote: 'Морето не си отива през септември. Отиват си само хората.' },
        ],
      },
      en: {
        title: 'The sea is better in October. Full stop.',
        excerpt: 'In July the sea is a wedding where you know nobody. In October it’s your sea.',
        body: [
          { p: 'In July the seaside is like a wedding where you don’t know anyone: loud, expensive, and someone is always standing on your towel.' },
          { p: 'October is a different story. The beach is empty, the water is still warm (fine, “warm”), the corn sellers have gone home and the seagulls run the place on their own.' },
          { h: 'Arguments that are not up for debate' },
          { p: 'You don’t have to get up at six to save a spot with your umbrella. You can wander old Sozopol without queuing for a photo. And the sunset is exactly the same — there’s just nobody in the way.' },
          { img: 'sozopol-beach.jpg', caption: { bg: 'Юли. Виждате ли за какво говоря?', en: 'July. See what I mean?' } },
          { p: 'The only downside is that you need a sweater. But I wear a sweater in July too, because bus air-conditioning is evil.' },
          { quote: 'The sea doesn’t leave in September. Only the people do.' },
        ],
      },
    },
    {
      slug: 'pet-minuti-zakasnenie',
      type: 'opinion',
      date: '2026-07-14',
      cover: 'tram-23.jpg',
      mood: { bg: 'леко закъсняла', en: 'slightly late' },
      bg: {
        title: 'Да закъснееш с пет минути е изкуство',
        excerpt: 'Точните хора са прекрасни, но и малко страшни. В защита на петте минути.',
        body: [
          { p: 'Ще го кажа направо: точните хора са прекрасни, но и малко страшни. Пристигат в 18:00:00 и вече им е неудобно заради теб.' },
          { p: 'Пет минути закъснение не са неуважение. Пет минути са буфер за живота — за трамвая, който решава да си почине, за съседката, която точно сега иска да ти разкаже за доматите си, за котката, която е седнала върху ключовете.' },
          { h: 'Правилата на изкуството' },
          { p: 'Първо: пет минути, не петнадесет. Петнадесет вече е грубост. Второ: пишеш съобщение преди да закъснееш, не след това. Трето: пристигаш с усмивка и, в идеалния случай, с нещо за хапване.' },
          { img: 'tram-23.jpg', caption: { bg: 'Трамвай 23. Причината за поне половината ми закъснения.', en: 'Tram 23. The reason for at least half of my late arrivals.' } },
          { quote: 'Пристигаш навреме за важното. Останалото е аритметика.' },
          { p: 'Не казвам, че трябва да закъснявате. Казвам, че светът няма да свърши. А ако все пак свърши, поне ще сте си допили кафето.' },
        ],
      },
      en: {
        title: 'Being five minutes late is an art form',
        excerpt: 'Punctual people are wonderful, but also a little scary. In defence of five minutes.',
        body: [
          { p: 'I’ll say it plainly: punctual people are wonderful, but also a little scary. They arrive at 18:00:00 and are already embarrassed on your behalf.' },
          { p: 'Five minutes late isn’t disrespect. Five minutes is a buffer for life — for the tram that decides to take a break, for the neighbour who has to tell you about her tomatoes right now, for the cat sitting on your keys.' },
          { h: 'The rules of the art' },
          { p: 'One: five minutes, not fifteen. Fifteen is just rude. Two: you text before you’re late, not after. Three: you arrive smiling and, ideally, with something to eat.' },
          { img: 'tram-23.jpg', caption: { bg: 'Трамвай 23. Причината за поне половината ми закъснения.', en: 'Tram 23. The reason for at least half of my late arrivals.' } },
          { quote: 'Be on time for what matters. The rest is arithmetic.' },
          { p: 'I’m not saying you should be late. I’m saying the world won’t end. And if it does, at least you’ll have finished your coffee.' },
        ],
      },
    },
    {
      slug: 'izgubih-se-v-plovdiv',
      type: 'story',
      date: '2026-05-10',
      cover: 'plovdiv-old-town.jpg',
      mood: { bg: 'изгубена и щастлива', en: 'lost & happy' },
      bg: {
        title: 'Изгубих се в Пловдив. Нарочно.',
        excerpt: 'Имам едно правило за нови градове: първия ден телефонът остава в чантата.',
        body: [
          { p: 'Имам едно правило за нови градове: първия ден оставям телефона в чантата и завивам там, където ми е най-интересно. Обикновено това означава котка, стълби или миризма на кафе.' },
          { p: 'В Пловдив започнах и с трите. Една рижа котка ме поведе нагоре по калдъръма на Стария град, покрай къщи, които изглеждат така, сякаш някой ги е рисувал с пастели и не е могъл да спре.' },
          { h: 'Калдъръмът не прощава' },
          { p: 'Важен съвет: калдъръмът в Стария град не е за сандали с тънка подметка. Научих го по трудния начин — на третото стъпало, пред група туристи, които ми изръкопляскаха. Поклоних се. Какво друго да направя?' },
          { img: 'plovdiv-street.jpg', caption: { bg: 'Мястото на престъплението.', en: 'The scene of the crime.' } },
          { p: 'Към залез стигнах до Небет тепе. Седнах на един камък, изядох баница от хартиен плик и гледах как градът светва прозорец по прозорец. Не знаех къде точно съм. Беше прекрасно.' },
          { quote: 'Понякога най-хубавият маршрут е този, който не си планирал.' },
          { p: 'На връщане, разбира се, извадих телефона. Не съм луда.' },
        ],
      },
      en: {
        title: 'I got lost in Plovdiv. On purpose.',
        excerpt: 'I have one rule for new cities: on day one, the phone stays in the bag.',
        body: [
          { p: 'I have one rule for new cities: on the first day I leave my phone in my bag and turn wherever looks most interesting. Usually that means a cat, some stairs or the smell of coffee.' },
          { p: 'In Plovdiv I started with all three. A ginger cat led me up the cobblestones of the Old Town, past houses that look like someone painted them in pastels and couldn’t stop.' },
          { h: 'The cobblestones show no mercy' },
          { p: 'Important tip: Old Town cobblestones are not for thin-soled sandals. I learned this the hard way — on the third step, in front of a tour group who applauded. I bowed. What else was I supposed to do?' },
          { img: 'plovdiv-street.jpg', caption: { bg: 'Мястото на престъплението.', en: 'The scene of the crime.' } },
          { p: 'Around sunset I reached Nebet Tepe. I sat on a rock, ate a banitsa out of a paper bag and watched the city light up window by window. I had no idea exactly where I was. It was wonderful.' },
          { quote: 'Sometimes the best route is the one you didn’t plan.' },
          { p: 'On the way back I did take the phone out, of course. I’m not crazy.' },
        ],
      },
    },
    {
      slug: 'martenitsata-i-shturkelat',
      type: 'opinion',
      date: '2026-04-18',
      cover: 'martenitsa-tree.jpg',
      mood: { bg: 'принципна', en: 'principled' },
      bg: {
        title: 'Махам мартеницата, когато АЗ видя щъркел',
        excerpt: 'Правилото е ясно. Проблемът е, че живея в центъра на София.',
        body: [
          { p: 'Всяка година на първи март започва едно и също състезание: кой ще се закичи с най-много мартеници. Аз печеля всяка година. Миналата пролет имах седемнадесет.' },
          { p: 'Правилото е ясно — сваляш мартеницата, когато видиш щъркел, лястовица или цъфнало дърво. После я връзваш на клонче за късмет.' },
          { p: 'Проблемът е, че живея в центъра на София. Последният щъркел, който видях, беше на кутия бисквити.' },
          { h: 'Моята позиция' },
          { p: 'Затова отказвам да ги махам по-рано. Когато някой ме пита защо в края на април още нося червено-бели конци по ръцете си, отговарям: „Чакам.“ И хората кимат с уважение.' },
          { img: 'martenitsa-tree.jpg', caption: { bg: 'Дърво с мартеници. Значи някой е видял щъркел. Аз — не.', en: 'A martenitsa tree. So someone saw a stork. Not me.' } },
          { quote: 'Традицията си е традиция. Щъркелът да заповяда.' },
        ],
      },
      en: {
        title: 'I take my martenitsa off when I see a stork',
        excerpt: 'The rule is clear. The problem is I live in the centre of Sofia.',
        body: [
          { p: 'Every year on the first of March the same competition begins: who can wear the most martenitsas. I win every year. Last spring I had seventeen.' },
          { p: 'The rule is clear — you take your martenitsa off when you see a stork, a swallow or a tree in blossom. Then you tie it to a branch for luck.' },
          { p: 'The problem is that I live in the centre of Sofia. The last stork I saw was on a box of biscuits.' },
          { h: 'My position' },
          { p: 'So I refuse to take them off early. When someone asks why I’m still wearing red-and-white threads at the end of April, I say: “I’m waiting.” And people nod respectfully.' },
          { img: 'martenitsa-tree.jpg', caption: { bg: 'Дърво с мартеници. Значи някой е видял щъркел. Аз — не.', en: 'A martenitsa tree. So someone saw a stork. Not me.' } },
          { quote: 'Tradition is tradition. The stork knows where to find me.' },
        ],
      },
    },
    {
      slug: 'kotkata-koyato-me-osinovi',
      type: 'story',
      date: '2026-02-22',
      cover: 'cat-sofia.jpg',
      mood: { bg: 'осиновена', en: 'adopted' },
      // Intentionally Bulgarian-only: shows the "only in Bulgarian" note in English mode.
      bg: {
        title: 'Котката, която ме осинови',
        excerpt: 'Не исках котка. Казвах го на всички, на висок глас, особено на котката.',
        body: [
          { p: 'Не исках котка. Казвах го на всички, на висок глас, особено на котката.' },
          { p: 'Тя се появи на входа през февруари — трицветна, с изражение на счетоводителка, която е открила грешка в отчета ти. Седна на стълбите и ме изгледа. Дадох ѝ малко шунка. Това беше грешката ми.' },
          { p: 'На следващия ден пак беше там. На по-следващия — на перваза. В края на седмицата спеше на любимия ми пуловер, а аз спях на ръба на леглото, за да не я безпокоя.' },
          { h: 'Кой кого гледа' },
          { p: 'Сега официално е „моята котка“, макар и двете да знаем, че е обратното. Кръстих я Ваня. Тя не реагира на името. Реагира единствено на звука на отварящ се хладилник.' },
          { img: 'cat-sofia.jpg', caption: { bg: 'Ваня при първата ни среща. Вече ме преценява.', en: 'Vanya the day we met. Already judging me.' } },
          { p: 'Ако някой ден не пиша дълго, вероятно съм затисната под нея и не смея да мръдна.' },
        ],
      },
    },
    {
      slug: 'kukerite-me-goniha',
      type: 'story',
      date: '2026-01-31',
      cover: 'kukeri.jpg',
      mood: { bg: 'пречистена', en: 'purified' },
      bg: {
        title: 'Кукерите ме гониха (и бяха прави)',
        excerpt: 'Отидох на Сурва „само да погледам“. Един кукер не се съгласи.',
        body: [
          { p: 'Ако не сте били на Сурва в Перник, представете си следното: стотици хора в маски с рога, козина и огромни звънци, които танцуват, за да прогонят злите духове. Звукът се чува от километри. Земята буквално трепери.' },
          { p: 'Аз отидох „само да погледам“. Застанах на първия ред с чаша чай и изражение на човек, който определено не е зъл дух.' },
          { p: 'Един кукер не се съгласи с тази оценка.' },
          { h: 'Бягството' },
          { p: 'Тръгна към мен с маска със зъби и звънци, които сигурно тежаха колкото мен. Изпуснах чая и хукнах. Хората наоколо се смееха. Кукерът също, мисля. Трудно е да се каже под толкова козина.' },
          { img: 'kuker-mask.jpg', caption: { bg: 'Той. Не забравям лица. Особено такива.', en: 'Him. I never forget a face. Especially this one.' } },
          { p: 'Накрая ме настигна, раздрънка звънците над главата ми и ми махна — сякаш да каже „свободна си“. Явно съм била пречистена. Тази година нищо лошо не ми се е случило. Освен чая.' },
        ],
      },
      en: {
        title: 'The kukeri chased me (and they had a point)',
        excerpt: 'I went to Surva “just to watch”. One kuker disagreed.',
        body: [
          { p: 'If you’ve never been to Surva in Pernik, picture this: hundreds of people in horned, furry masks and enormous bells, dancing to chase away evil spirits. You can hear it for miles. The ground literally shakes.' },
          { p: 'I went “just to watch”. I stood in the front row with a cup of tea and the face of someone who is definitely not an evil spirit.' },
          { p: 'One kuker did not agree with that assessment.' },
          { h: 'The escape' },
          { p: 'He came at me with a toothy mask and bells that must have weighed as much as I do. I dropped my tea and ran. Everyone around was laughing. So was the kuker, I think. Hard to tell under that much fur.' },
          { img: 'kuker-mask.jpg', caption: { bg: 'Той. Не забравям лица. Особено такива.', en: 'Him. I never forget a face. Especially this one.' } },
          { p: 'Eventually he caught up, rattled his bells over my head and waved — as if to say “you’re free”. Apparently I’d been purified. Nothing bad has happened to me all year. Except the tea.' },
        ],
      },
    },
    {
      slug: 'kasmet-astronavt',
      type: 'story',
      date: '2026-01-03',
      cover: 'banitsa-fortunes.jpg',
      mood: { bg: 'космическа', en: 'cosmic' },
      bg: {
        title: 'Късметът в баницата каза, че ще стана астронавт',
        excerpt: 'У нас на Нова година баницата е по-важна от фойерверките.',
        body: [
          { p: 'У нас на Нова година баницата е по-важна от фойерверките. Баба я прави с късмети — малки листчета, увити във фолио и скрити между корите. Всеки си взима парче и чете на глас какво го чака.' },
          { p: 'Тази година на брат ми се падна „пари“. На мама — „здраве“. На кучето (да, и кучето има парче) — „път“. Кучето веднага излезе на двора. Явно го прие насериозно.' },
          { p: 'На мен ми се падна „космос“.' },
          { h: 'Изясняване на обстоятелствата' },
          { p: 'Оказа се, че тази година баба е писала късметите заедно с шестгодишния ни братовчед. Той имал „по-интересни идеи“. Затова някой получи „динозавър“, а леля — „много сладолед“.' },
          { img: 'banitsa-fortunes.jpg', caption: { bg: 'Баницата. Улика номер едно.', en: 'The banitsa. Exhibit A.' } },
          { p: 'Аз обаче реших да не споря със съдбата. Записах се за лекция за черни дупки в планетариума. Ако това не е първата крачка към космоса, не знам коя е.' },
          { quote: 'Не подценявай късмет, написан с флумастер.' },
        ],
      },
      en: {
        title: 'My banitsa fortune said I’d become an astronaut',
        excerpt: 'In our family, on New Year’s Eve the banitsa matters more than the fireworks.',
        body: [
          { p: 'In our family, on New Year’s Eve the banitsa matters more than the fireworks. Grandma bakes it with fortunes — little notes wrapped in foil and hidden between the layers of pastry. Everyone takes a piece and reads out what the year has in store.' },
          { p: 'This year my brother got “money”. Mum got “health”. The dog (yes, the dog gets a piece too) got “travel”. The dog went straight out into the yard. Clearly took it seriously.' },
          { p: 'I got “outer space”.' },
          { h: 'Clarifying the circumstances' },
          { p: 'It turned out Grandma had written the fortunes this year with our six-year-old cousin. He had “more interesting ideas”. Which is why someone got “dinosaur” and my aunt got “lots of ice cream”.' },
          { img: 'banitsa-fortunes.jpg', caption: { bg: 'Баницата. Улика номер едно.', en: 'The banitsa. Exhibit A.' } },
          { p: 'I, however, decided not to argue with fate. I signed up for a talk on black holes at the planetarium. If that isn’t the first step into space, I don’t know what is.' },
          { quote: 'Never underestimate a fortune written in felt-tip pen.' },
        ],
      },
    },
  ],

  albums: [
    {
      slug: 'sofia',
      title: { bg: 'София', en: 'Sofia' },
      note: { bg: 'Градът ми. Трамваи, котки, кубета.', en: 'My city. Trams, cats, domes.' },
      photos: [
        { file: 'nevsky.jpg', w: 1600, h: 1016, caption: { bg: 'Невски. Всеки път прилича на торта.', en: 'Nevsky. Looks like a cake every single time.' } },
        { file: 'sofia-tram.jpg', w: 1600, h: 1200, caption: { bg: 'Зеленият трамвай. Любимият ми.', en: 'The green tram. My favourite.' } },
        { file: 'tram-23.jpg', w: 1600, h: 1066, caption: { bg: 'Трамвай 23 в гората. Да, в гората.', en: 'Tram 23 in the woods. Yes, the woods.' } },
        { file: 'cat-sofia.jpg', w: 1200, h: 1600, caption: { bg: 'Ваня. Шефката.', en: 'Vanya. The boss.' } },
        { file: 'street-cats.jpg', w: 1600, h: 686, caption: { bg: 'Котешко събрание на покрива.', en: 'Cat council on the roof.' } },
      ],
    },
    {
      slug: 'more',
      title: { bg: 'Море', en: 'Sea' },
      note: { bg: 'Черно е само на името.', en: 'Black in name only.' },
      photos: [
        { file: 'sozopol-beach.jpg', w: 1600, h: 1067, caption: { bg: 'Созопол през юли. Никога повече.', en: 'Sozopol in July. Never again.' } },
        { file: 'sozopol-beach-2.jpg', w: 1067, h: 1600, caption: { bg: 'Скалите са по-удобни от шезлонг.', en: 'Rocks are comfier than a sunbed.' } },
        { file: 'nesebar.jpg', w: 1600, h: 1106, caption: { bg: 'Несебър, преди туристите да се събудят.', en: 'Nesebar before the tourists wake up.' } },
        { file: 'nesebar-fountain.jpg', w: 1200, h: 1600, caption: { bg: 'Пих оттук. Още съм жива.', en: 'Drank from it. Still alive.' } },
      ],
    },
    {
      slug: 'planini',
      title: { bg: 'Планини и скали', en: 'Mountains & rocks' },
      note: { bg: 'Където телефонът няма обхват, а аз — нямам нужда.', en: 'Where my phone has no signal and I don’t need one.' },
      photos: [
        { file: 'rila-lakes.jpg', w: 1600, h: 1201, caption: { bg: 'Седемте езера. Преброих ги. Седем са.', en: 'Seven Lakes. I counted. There are seven.' } },
        { file: 'rila-dance.jpg', w: 1600, h: 1200, caption: { bg: 'Отгоре всичко изглежда простимо.', en: 'From up here everything looks forgivable.' } },
        { file: 'rila-monastery.jpg', w: 1062, h: 1600, caption: { bg: 'Рилският манастир. Тук се говори тихо.', en: 'Rila Monastery. Here you whisper.' } },
        { file: 'melnik.jpg', w: 1600, h: 1200, caption: { bg: 'Мелнишките пирамиди. Пясък, който се прави на планина.', en: 'Melnik pyramids. Sand pretending to be a mountain.' } },
        { file: 'belogradchik.jpg', w: 1600, h: 1066, caption: { bg: 'Белоградчик. Скали с характер.', en: 'Belogradchik. Rocks with attitude.' } },
        { file: 'belogradchik-2.jpg', w: 1600, h: 1066, caption: { bg: 'Тези двете се карат от милион години.', en: 'These two have been arguing for a million years.' } },
        { file: 'buzludzha.jpg', w: 1600, h: 1032, caption: { bg: 'Бузлуджа отдалеч. НЛО, паркирало на хълма.', en: 'Buzludzha from afar. A UFO parked on a hill.' } },
        { file: 'buzludzha-above.jpg', w: 1378, h: 1600, caption: { bg: 'Краката ми над Бузлуджа. Не казвайте на мама.', en: 'My feet over Buzludzha. Don’t tell my mum.' } },
        { file: 'sunflowers.jpg', w: 1600, h: 1067, caption: { bg: 'Слънчогледи. Всички гледат натам, освен един.', en: 'Sunflowers. All facing one way, except one.' } },
      ],
    },
    {
      slug: 'stari-gradove',
      title: { bg: 'Стари градове', en: 'Old towns' },
      note: { bg: 'Калдъръм, стълби и къщи, облечени по-добре от мен.', en: 'Cobblestones, stairs and houses dressed better than me.' },
      photos: [
        { file: 'plovdiv-old-town.jpg', w: 1600, h: 1070, caption: { bg: 'Пловдив. Къщите тук се обличат по-добре от мен.', en: 'Plovdiv. The houses dress better than I do.' } },
        { file: 'plovdiv-street.jpg', w: 1200, h: 1600, caption: { bg: 'Калдъръмът, който ме победи.', en: 'The cobblestones that defeated me.' } },
        { file: 'koprivshtitsa.jpg', w: 1600, h: 1066, caption: { bg: 'Копривщица. Синята къща ме гледа.', en: 'Koprivshtitsa. The blue house is watching me.' } },
        { file: 'koprivshtitsa-2.jpg', w: 1600, h: 1066, caption: { bg: 'Тук времето е спряло. И уайфаят.', en: 'Time stopped here. So did the wi-fi.' } },
        { file: 'tarnovo.jpg', w: 1600, h: 1066, caption: { bg: 'Търново. Стълби, стълби, стълби.', en: 'Tarnovo. Stairs, stairs, stairs.' } },
        { file: 'tsarevets.jpg', w: 1600, h: 1176, caption: { bg: 'Царевец. Кралица за един ден.', en: 'Tsarevets. Queen for a day.' } },
      ],
    },
    {
      slug: 'traditsii',
      title: { bg: 'Традиции', en: 'Traditions' },
      note: { bg: 'Звънци, конци и баница. Много баница.', en: 'Bells, threads and banitsa. Lots of banitsa.' },
      photos: [
        { file: 'kukeri.jpg', w: 1600, h: 1067, caption: { bg: 'Сурва. Земята трепери.', en: 'Surva. The ground shakes.' } },
        { file: 'kuker-mask.jpg', w: 1086, h: 1600, caption: { bg: 'Той. Знаете кой.', en: 'Him. You know who.' } },
        { file: 'kukeri-2.jpg', w: 1067, h: 1600, caption: { bg: 'Тези звънци тежат повече от мен.', en: 'Those bells weigh more than I do.' } },
        { file: 'martenitsa-tree.jpg', w: 1600, h: 1064, caption: { bg: 'Дърво с мартеници. Някой е видял щъркел.', en: 'A martenitsa tree. Someone saw a stork.' } },
        { file: 'martenitsa-bells.jpg', w: 1200, h: 1600, caption: { bg: 'Пижо и Пенда. Винаги заедно.', en: 'Pizho and Penda. Always together.' } },
        { file: 'banitsa.jpg', w: 1600, h: 1017, caption: { bg: 'Баница и айрян. Закуска на шампиони.', en: 'Banitsa and ayran. Breakfast of champions.' } },
        { file: 'banitsa-fortunes.jpg', w: 1200, h: 1600, caption: { bg: 'Някъде тук е моят „космос“.', en: 'Somewhere in here is my “outer space”.' } },
      ],
    },
  ],
};
