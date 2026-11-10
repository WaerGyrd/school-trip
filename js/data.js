// 기본 내용입니다. 사이트에서 교사가 고친 내용이 있으면 그쪽이 우선합니다.
// team 값: all(공통) / A / B / tbd(미정)
// 홈 말풍선: 호치민 소개 (사이트에서 고치는 내용이 아니라 고정 문구)
export const CITY_INTRO = "호치민시는 베트남의 경제 중심지이자\n과거와 현재가 함께 살아 숨 쉬는 도시입니다.\n수학여행에서 역사적인 명소와 현지의 거리 문화를 둘러보며 베트남의 다양한 모습을 경험할 수 있습니다!";

// 공지 "작성자"로 고를 수 있는 10학년부 선생님 (고정 목록)
export const NOTICE_AUTHORS = ["김영한", "배일환", "조지용", "이수선", "이재이", "한현", "김영훈"];

export const DEFAULTS = {

  // title: 그날 큰 제목 / summary: 일정 티켓에 들어갈 주요 장소 / tagline: 상세 화면 한 줄 설명
  schedule: [
    {
      date: "2026-11-18", label: "11/18 (수)", title: "하노이 → 호치민 → 호짬",
      summary: "VN209 · 통일궁 관람 · 하버 식당 · 호텔 체크인", tagline: "비행기 타고 남쪽으로, 통일궁 보고 바닷가 호텔로", info: "",
      items: [
        { t: "05:00", e: "07:00", title: "픽업 · 공항 이동", desc: "7시 공항 도착", team: "all" },
        { t: "09:00", e: "11:10", title: "VN209 하노이 → 호치민", desc: "기내 간식 제공", team: "all" },
        { t: "11:10", e: "12:00", title: "식당으로 이동", desc: "", team: "all" },
        { t: "12:00", e: "13:00", title: "점심 · 아리랑 식당", desc: "한식 · 제육볶음, 해물파전 등", team: "all" },
        { t: "13:00", e: "14:00", title: "통일궁 관람", desc: "", team: "all" },
        { t: "14:00", e: "17:00", title: "붕따우 · 호짬으로 이동", desc: "", team: "all" },
        { t: "17:00", e: "18:00", title: "저녁 · 하버 식당", desc: "현지식 세트 메뉴 (에메랄드 호짬 리조트 안)", team: "all" },
        { t: "18:00", e: "20:30", title: "호텔 체크인", desc: "Holiday Inn Resort Ho Tram", team: "all" },
        { t: "20:30", e: "23:00", title: "야식 · 자유 시간", desc: "", team: "all" }
      ]
    },
    {
      date: "2026-11-19", label: "11/19 (목)", title: "붕따우",
      summary: "붕따우 광장 단체 사진 · A팀 썬월드 · B팀 시내 투어 · 레크리에이션", tagline: "바다 보고, 워터파크 아니면 시내 투어",
      info: "A팀/B팀 반 배정은 정해지면 알려드려요.",
      items: [
        { t: "07:00", e: "09:00", title: "호텔 조식", desc: "", team: "all" },
        { t: "09:00", e: "10:00", title: "붕따우 광장으로 이동", desc: "반별 버스로 이동\n단체 사진 · 반별 사진 촬영, 바다 구경", team: "all" },
        { t: "10:00", e: "16:00", title: "썬월드 워터파크", desc: "점심은 워터파크 안 뷔페", team: "A" },
        { t: "10:00", e: "16:00", title: "붕따우 시내 투어", desc: "예수상 · 화이트 팰리스 · 붕따우 성당\n점심은 현지식 세트 메뉴", team: "B" },
        { t: "16:00", e: "17:00", title: "호텔로 이동", desc: "", team: "all" },
        { t: "17:00", e: "17:30", title: "개인 정비", desc: "", team: "all" },
        { t: "17:30", e: "19:00", title: "저녁 식사", desc: "호텔식 뷔페", team: "all" },
        { t: "19:00", e: "21:30", title: "레크리에이션", desc: "호텔 컨퍼런스룸 · 피자, 음료 제공", team: "all" }
      ]
    },
    {
      date: "2026-11-20", label: "11/20 (금)", title: "호치민 → 하노이",
      summary: "송빈 성당 · 강남BBQ · 전쟁·역사 박물관 · VN254", tagline: "박물관 두 곳, 그리고 집으로", info: "",
      items: [
        { t: "07:00", e: "08:00", title: "호텔 조식", desc: "", team: "all" },
        { t: "08:00", e: "10:00", title: "호치민으로 이동", desc: "", team: "all" },
        { t: "10:00", e: "10:30", title: "송빈 성당", desc: "사진 촬영 · 화장실", team: "all" },
        { t: "10:30", e: "12:00", title: "호치민 도착", desc: "", team: "all" },
        { t: "12:00", e: "13:00", title: "점심 · 강남BBQ / 미각", desc: "붙어 있는 두 식당에 3개 반씩\n제육볶음, 간장 불고기 등", team: "all" },
        { t: "13:00", e: "15:30", title: "전쟁 박물관 → 역사 박물관", desc: "1, 2, 3반", team: "A" },
        { t: "13:00", e: "15:30", title: "역사 박물관 → 전쟁 박물관", desc: "4, 5, 6반", team: "B" },
        { t: "15:30", e: "17:00", title: "공항으로 이동", desc: "공항 주차장에 모여 햄버거 먹고 공항으로", team: "all" },
        { t: "17:00", e: "19:10", title: "VN254 호치민 → 하노이", desc: "", team: "all" },
        { t: "19:10", e: "20:00", title: "하노이 도착", desc: "배정된 차량으로 귀가", team: "all" }
      ]
    }
  ],

  // dep: 출발 시간 / fromQ, toQ: 구글맵 검색어 또는 "위도,경도" / time, dist 가 비어 있으면 "확인 중"
  routes: [
    { day: 1, dep: "11:10", title: "공항 → 아리랑 식당", fromQ: "Tan Son Nhat International Airport", toQ: "Arirang Korean restaurant Ho Chi Minh City", time: "", dist: "", note: "", todo: true, img: "" },
    { day: 1, dep: "13:00", title: "아리랑 식당 → 통일궁", fromQ: "Arirang Korean restaurant Ho Chi Minh City", toQ: "Reunification Palace Ho Chi Minh City", time: "", dist: "", note: "", todo: true, img: "" },
    { day: 1, dep: "14:00", title: "통일궁 → 하버 식당", fromQ: "Reunification Palace Ho Chi Minh City", toQ: "10.4711464,107.3982098", time: "", dist: "", note: "하버 식당은 에메랄드 호짬 리조트 안에 있어요.", todo: false, img: "" },
    { day: 2, dep: "09:00", title: "호텔 → 붕따우 광장", fromQ: "Holiday Inn Resort Ho Tram Beach", toQ: "10.3455555,107.097283", time: "", dist: "", note: "", todo: false, img: "" },
    { day: 2, dep: "10:00", title: "A팀 · 붕따우 광장 → 썬월드", fromQ: "10.3455555,107.097283", toQ: "Sun World Vung Tau", time: "", dist: "", note: "", todo: true, img: "" },
    { day: 2, dep: "10:00", title: "B팀 · 붕따우 광장 → 시내 투어", fromQ: "10.3455555,107.097283", toQ: "Statue of Jesus Christ Vung Tau", time: "", dist: "", note: "예수상 · 화이트 팰리스 · 붕따우 성당 순서는 현장에서 안내해요.", todo: false, img: "" },
    { day: 2, dep: "16:00", title: "A팀 · 썬월드 → 호텔", fromQ: "Sun World Vung Tau", toQ: "Holiday Inn Resort Ho Tram Beach", time: "", dist: "", note: "", todo: true, img: "" },
    { day: 2, dep: "16:00", title: "B팀 · 시내 → 호텔", fromQ: "Statue of Jesus Christ Vung Tau", toQ: "Holiday Inn Resort Ho Tram Beach", time: "", dist: "", note: "", todo: false, img: "" },
    { day: 3, dep: "08:00", title: "호텔 → 송빈 성당", fromQ: "Holiday Inn Resort Ho Tram Beach", toQ: "10.5713214,107.0557317", time: "", dist: "", note: "", todo: false, img: "" },
    { day: 3, dep: "10:30", title: "송빈 성당 → 강남BBQ · 미각", fromQ: "10.5713214,107.0557317", toQ: "10.7330398,106.7082962", time: "", dist: "", note: "두 식당이 붙어 있어요. 3개 반씩 나눠 들어가요.", todo: false, img: "" },
    { day: 3, dep: "13:00", title: "A팀 · 전쟁 박물관 → 역사 박물관", fromQ: "War Remnants Museum Ho Chi Minh City", toQ: "Museum of Vietnamese History Ho Chi Minh City", time: "", dist: "", note: "1, 2, 3반", todo: false, img: "" },
    { day: 3, dep: "13:00", title: "B팀 · 역사 박물관 → 전쟁 박물관", fromQ: "Museum of Vietnamese History Ho Chi Minh City", toQ: "War Remnants Museum Ho Chi Minh City", time: "", dist: "", note: "4, 5, 6반", todo: false, img: "" },
    { day: 3, dep: "15:30", title: "박물관 → 공항", fromQ: "War Remnants Museum Ho Chi Minh City", toQ: "Tan Son Nhat International Airport", time: "", dist: "", note: "공항 주차장에 모여 햄버거를 먹고 들어가요.", todo: false, img: "" }
  ],

  // when: 언제 가는지 / label: "○○, 박물관 가기 전 딱 N가지만 알자!" 의 ○○
  learn: [
    {
      name: "통일궁", en: "Reunification Palace", when: "1일차 · 호치민", label: "베트남 현대사", img: "assets/learn/palace.jpg",
      summary: "남베트남 대통령이 일하던 곳이자, 베트남 전쟁이 끝난 장소예요.",
      topics: [
        { title: "어떤 건물일까?", body: "원래 남베트남 대통령이 살면서 일하던 '독립궁'이에요. 프랑스가 지은 옛 건물이 1962년 폭격으로 부서진 뒤, 베트남 건축가 응오비엣투가 설계해 1966년에 지금 모습으로 다시 지었어요." },
        { title: "1975년 4월 30일", body: "북베트남군 탱크가 이 건물 정문을 부수고 들어오면서 사이공이 함락되고, 베트남 전쟁이 사실상 끝났어요. 다음 해 남북이 하나로 합쳐지면서 '통일궁'이라는 이름이 붙었어요." },
        { title: "안에서 꼭 볼 것", body: "지하에는 전쟁 때 쓰던 작전 상황실과 통신실이 그대로 남아 있어요. 옥상의 헬리콥터와 앞마당에 전시된 탱크도 놓치지 마세요." },
        { title: "관람할 때 주의할 점", body: "건물이 넓고 층과 계단이 많아서 반 친구들과 떨어지기 쉬워요. 담임 선생님을 따라 줄 맞춰 이동하고, 실내에서는 조용히 관람해요." }
      ]
    },
    {
      name: "전쟁 박물관", en: "War Remnants Museum", when: "3일차 · 호치민", label: "베트남 전쟁", img: "assets/learn/war.jpg",
      summary: "베트남 전쟁의 모습과 피해를 사진과 자료로 보여주는 박물관이에요.",
      topics: [
        { title: "왜 싸웠을까?", body: "프랑스에서 독립한 뒤 한국처럼 북(공산)과 남(자유)으로 갈라졌다. 북베트남이 무력 통일을 하려 하자, 공산화를 막으려는 미국이 참여하면서 큰 국제전이 벌어졌다." },
        { title: "어떻게 끝났을까?", body: "1973년 파리 평화협정으로 미군이 철수했어요. 그 뒤에도 싸움은 이어졌고, 1975년 4월 30일 사이공이 함락되면서 전쟁이 끝났어요. 1976년 베트남은 하나의 나라로 통일됐어요." },
        { title: "한국과 무슨 사이?", body: "한국은 1964년부터 1973년까지 남베트남을 돕기 위해 군대를 보냈어요. 그래서 이 전쟁은 두 나라 모두에게 아픈 기억으로 남아 있어요. 두 나라는 1992년에 수교했고, 지금은 서로 가장 가까운 나라 중 하나예요." },
        { title: "박물관 볼 때 주의할 점", body: "전쟁 피해를 찍은 사진이 많아서 마음이 무거울 수 있어요. 힘들면 잠깐 쉬어도 괜찮아요. 고통받은 사람들을 기억하는 곳이니 웃거나 장난치지 말고 조용히 관람해요." }
      ]
    },
    {
      name: "역사 박물관", en: "Museum of Vietnamese History", when: "3일차 · 호치민", label: "베트남 역사", img: "assets/learn/history.jpg",
      summary: "선사시대부터 마지막 왕조까지, 베트남의 역사를 유물로 만나는 박물관이에요.",
      topics: [
        { title: "어떤 곳일까?", body: "1929년 프랑스 식민지 시절에 문을 연 박물관이에요. 사이공 동식물원 안에 있고, 동양식 지붕과 서양식 건물이 섞인 모습이 독특해요." },
        { title: "무엇을 볼 수 있을까?", body: "선사시대 유물부터 베트남의 마지막 왕조인 응우옌 왕조까지, 시대 순서대로 도자기, 불상, 무기, 생활 도구가 전시되어 있어요." },
        { title: "꼭 찾아볼 것", body: "청동기 시대의 동선 청동북은 베트남을 대표하는 유물이에요. 남부에 있던 참파 왕국의 돌 조각도 함께 찾아보세요." },
        { title: "관람할 때 주의할 점", body: "오래된 유물이 많으니 만지거나 기대지 않아요. 사진을 찍을 때는 플래시를 끄고, 다른 관람객을 위해 조용히 이동해요." }
      ]
    }
  ],

  // place: palace(통일궁) / war(전쟁 박물관) / history(역사 박물관). 한 판에 10문제를 무작위로 뽑아요.
  quiz: [
    { place: "palace", q: "통일궁의 옛 이름은 '독립궁'이다.", a: true, exp: "맞아요. 남베트남 시절에는 '독립궁'이라고 불렀어요." },
    { place: "palace", q: "통일궁은 베트남 국왕이 살던 왕궁이다.", a: false, exp: "아니에요. 남베트남 대통령이 살면서 일하던 곳이에요." },
    { place: "palace", q: "1975년 4월 30일, 북베트남군 탱크가 통일궁 정문을 부수고 들어갔다.", a: true, exp: "맞아요. 이 장면으로 베트남 전쟁이 사실상 끝났어요." },
    { place: "palace", q: "지금의 통일궁 건물은 프랑스 건축가가 설계했다.", a: false, exp: "아니에요. 베트남 건축가 응오비엣투가 설계해 1966년에 지었어요." },
    { place: "palace", q: "통일궁 지하에는 전쟁 때 쓰던 상황실과 통신실이 남아 있다.", a: true, exp: "맞아요. 지하 벙커가 당시 모습 그대로 보존되어 있어요." },
    { place: "palace", q: "통일궁 옥상에는 헬리콥터가 전시되어 있다.", a: true, exp: "맞아요. 옥상에서 헬리콥터를 볼 수 있어요." },
    { place: "palace", q: "'통일궁'이라는 이름은 1945년에 붙었다.", a: false, exp: "아니에요. 1975년 전쟁이 끝나고 남북이 하나가 된 뒤에 붙은 이름이에요." },
    { place: "palace", q: "통일궁은 하노이에 있다.", a: false, exp: "아니에요. 호치민시에 있어요." },
    { place: "palace", q: "1975년 4월 30일은 베트남 전쟁이 사실상 끝난 날이다.", a: true, exp: "맞아요. 사이공이 함락된 날이에요." },
    { place: "palace", q: "통일궁 앞마당에는 비행기만 있고 탱크는 전시되어 있지 않다.", a: false, exp: "아니에요. 앞마당에 탱크가 전시되어 있어요." },
    { place: "war", q: "베트남 전쟁 때 베트남은 남과 북으로 나뉘어 있었다.", a: true, exp: "맞아요. 한국처럼 북(공산)과 남(자유)으로 갈라져 있었어요." },
    { place: "war", q: "미국은 남베트남을 도우며 전쟁에 참여했다.", a: true, exp: "맞아요. 공산화를 막으려고 참여했어요." },
    { place: "war", q: "한국은 베트남 전쟁에 군대를 보내지 않았다.", a: false, exp: "아니에요. 한국은 1964년부터 1973년까지 군대를 보냈어요." },
    { place: "war", q: "한국군은 1964년부터 1973년까지 베트남에 파병되었다.", a: true, exp: "맞아요." },
    { place: "war", q: "1973년 파리 평화협정 이후 미군이 철수했다.", a: true, exp: "맞아요. 그 뒤에도 전쟁은 1975년까지 이어졌어요." },
    { place: "war", q: "베트남은 1990년에 하나의 나라로 통일되었다.", a: false, exp: "아니에요. 1976년에 통일되었어요." },
    { place: "war", q: "한국과 베트남은 1992년에 수교했다.", a: true, exp: "맞아요. 지금은 서로 가장 가까운 나라 중 하나예요." },
    { place: "war", q: "전쟁 박물관에는 사진은 없고 무기만 전시되어 있다.", a: false, exp: "아니에요. 여러 나라 기자들이 찍은 전쟁 사진이 많이 전시되어 있어요." },
    { place: "war", q: "베트남에서는 베트남 전쟁을 '미국 전쟁'이라고도 부른다.", a: true, exp: "맞아요. 베트남 입장에서는 미국과 싸운 전쟁이기 때문이에요." },
    { place: "war", q: "베트남 전쟁은 북베트남의 패배로 끝났다.", a: false, exp: "아니에요. 북베트남이 사이공을 점령하면서 끝났어요." },
    { place: "history", q: "역사 박물관은 1929년에 처음 문을 열었다.", a: true, exp: "맞아요. 프랑스 식민지 시절에 세워졌어요." },
    { place: "history", q: "역사 박물관은 사이공 동식물원 안에 있다.", a: true, exp: "맞아요." },
    { place: "history", q: "역사 박물관 건물은 동양식 지붕과 서양식 건물이 섞인 모습이다.", a: true, exp: "맞아요. 그래서 건물 자체도 볼거리예요." },
    { place: "history", q: "동선 청동북은 청동기 시대 베트남을 대표하는 유물이다.", a: true, exp: "맞아요. 꼭 찾아보세요." },
    { place: "history", q: "응우옌 왕조는 베트남의 첫 번째 왕조이다.", a: false, exp: "아니에요. 베트남의 마지막 왕조예요." },
    { place: "history", q: "참파 왕국은 베트남 북부에 있던 나라이다.", a: false, exp: "아니에요. 베트남 중남부에 있던 나라예요." },
    { place: "history", q: "역사 박물관은 주로 현대 전쟁 무기를 전시한다.", a: false, exp: "아니에요. 선사시대부터 왕조 시대까지의 유물을 전시해요." },
    { place: "history", q: "박물관에서 사진을 찍을 때는 플래시를 켜는 것이 좋다.", a: false, exp: "아니에요. 유물이 상할 수 있어서 플래시는 꺼요." },
    { place: "history", q: "베트남 역사 박물관은 하노이에만 있다.", a: false, exp: "아니에요. 우리가 가는 곳은 호치민시에 있는 역사 박물관이에요." },
    { place: "history", q: "역사 박물관은 유물을 시대 순서대로 보여준다.", a: true, exp: "맞아요. 선사시대부터 차례로 둘러볼 수 있어요." }
  ],

  teachers: [
    { name: "김영한", role: "", nick: "", intro: "" },
    { name: "배일환", role: "", nick: "", intro: "" },
    { name: "조지용", role: "", nick: "", intro: "" },
    { name: "이수선", role: "", nick: "", intro: "" },
    { name: "이재이", role: "", nick: "", intro: "" },
    { name: "한현", role: "", nick: "", intro: "" },
    { name: "김영훈", role: "", nick: "", intro: "" }
  ],

  settings: {
    home: { desc: "호치민시는 베트남의 경제 중심지이자\n과거와 현재가 함께 살아 숨 쉬는 도시입니다.\n수학여행에서 역사적인 명소와 현지의 거리 문화를 둘러보며 베트남의 다양한 모습을 경험할 수 있습니다!" },
    teams: {},
    padlet: "https://padlet.com/xumm1n3/2026-kish-s025bxzekoi8mpfapohx"
  }
};
