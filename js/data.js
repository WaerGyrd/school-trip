// 기본 내용입니다. 사이트에서 교사가 고친 내용이 있으면 그쪽이 우선합니다.
// team 값: all(공통) / A / B / tbd(미정)
export const DEFAULTS = {

  schedule: [
    {
      date: "2026-11-18", label: "11/18 (수)", title: "DAY 1 · 하노이 → 호치민 → 호짬", info: "",
      items: [
        { t: "05:00", e: "07:00", title: "픽업 · 공항 이동", desc: "7시 공항 도착", team: "all" },
        { t: "09:00", e: "11:10", title: "VN209 하노이 → 호치민", desc: "기내 간식 제공", team: "all" },
        { t: "11:10", e: "12:00", title: "식당으로 이동", desc: "", team: "all" },
        { t: "12:00", e: "13:00", title: "점심 · 아리랑 식당", desc: "한식", team: "all" },
        { t: "13:00", e: "14:00", title: "통일궁 관람", desc: "", team: "all" },
        { t: "14:00", e: "17:00", title: "붕따우 · 호짬으로 이동", desc: "", team: "all" },
        { t: "17:00", e: "18:00", title: "저녁 · 하버 식당", desc: "현지식 세트 메뉴", team: "all" },
        { t: "18:00", e: "20:30", title: "호텔 체크인", desc: "Holiday Inn Resort Ho Tram", team: "all" },
        { t: "20:30", e: "23:00", title: "야식 · 자유 시간", desc: "", team: "all" }
      ]
    },
    {
      date: "2026-11-19", label: "11/19 (목)", title: "DAY 2 · 붕따우", info: "A팀/B팀 배정은 일정 화면에서 확인해요.",
      items: [
        { t: "07:00", e: "09:00", title: "호텔 조식", desc: "", team: "all" },
        { t: "09:00", e: "10:00", title: "붕따우 광장 이동", desc: "반별 버스로 이동\n단체 · 반 사진 촬영, 바다 구경", team: "all" },
        { t: "10:00", e: "16:00", title: "선월드 워터파크", desc: "점심은 내부 뷔페\n(광장에서 이동하는 방식은 미정)", team: "A" },
        { t: "10:00", e: "16:00", title: "붕따우 시내 투어", desc: "예수상 · 백색궁전 · 붕따우 성당\n점심은 현지식 세트 메뉴\n(광장에서 이동하는 방식은 미정)", team: "B" },
        { t: "16:00", e: "17:00", title: "호텔 복귀", desc: "", team: "all" },
        { t: "17:00", e: "17:30", title: "개인 정비", desc: "", team: "all" },
        { t: "17:30", e: "19:00", title: "호텔 뷔페 저녁", desc: "", team: "all" },
        { t: "19:00", e: "21:30", title: "레크레이션", desc: "호텔 컨퍼런스룸 (2~2.5시간)\n피자 · 음료 제공", team: "all" }
      ]
    },
    {
      date: "2026-11-20", label: "11/20 (금)", title: "DAY 3 · 호치민 → 하노이", info: "",
      items: [
        { t: "07:00", e: "08:00", title: "호텔 조식", desc: "", team: "all" },
        { t: "08:00", e: "10:00", title: "호치민으로 이동", desc: "", team: "all" },
        { t: "10:00", e: "10:30", title: "송빈 성당", desc: "사진 촬영 · 화장실", team: "all" },
        { t: "10:30", e: "12:00", title: "호치민 도착", desc: "", team: "all" },
        { t: "12:00", e: "13:00", title: "점심 · 코리안타운", desc: "강남BBQ / 미각 (붙어 있는 두 식당, 3개 반씩)", team: "all" },
        { t: "13:00", e: "15:30", title: "전쟁박물관 → 역사박물관", desc: "", team: "A" },
        { t: "13:00", e: "15:30", title: "역사박물관 → 전쟁박물관", desc: "", team: "B" },
        { t: "15:30", e: "17:00", title: "공항 주차장 집결 · 공항 이동", desc: "버거 제공, 공항에서 대기", team: "all" },
        { t: "17:00", e: "19:10", title: "VN254 호치민 → 하노이", desc: "", team: "all" },
        { t: "19:10", e: "20:00", title: "하노이 도착", desc: "배정된 차량으로 귀가", team: "all" }
      ]
    }
  ],

  // time, dist 가 비어 있으면 "조사 중"으로 보여요. fromQ/toQ 는 구글맵 검색어(정확한 이름이나 주소로 고쳐 주세요).
  routes: [
    { day: 1, title: "공항 → 아리랑 식당", fromQ: "Tan Son Nhat International Airport", toQ: "Arirang Korean restaurant Ho Chi Minh City", time: "", dist: "", note: "", todo: true, img: "" },
    { day: 1, title: "아리랑 식당 → 통일궁", fromQ: "Arirang Korean restaurant Ho Chi Minh City", toQ: "Reunification Palace Ho Chi Minh City", time: "", dist: "", note: "", todo: true, img: "" },
    { day: 1, title: "통일궁 → 하버 식당", fromQ: "Reunification Palace Ho Chi Minh City", toQ: "Ho Tram Vietnam", time: "", dist: "", note: "하버 식당의 정확한 위치를 확인해 주세요.", todo: true, img: "" },
    { day: 2, title: "호텔 → 붕따우 광장", fromQ: "Holiday Inn Resort Ho Tram Beach", toQ: "Vung Tau Vietnam", time: "", dist: "", note: "광장의 정확한 주소를 확인해 주세요.", todo: true, img: "" },
    { day: 2, title: "A팀 · 붕따우 광장 → 선월드", fromQ: "Vung Tau Vietnam", toQ: "Sunworld Vung Tau", time: "", dist: "", note: "", todo: true, img: "" },
    { day: 2, title: "B팀 · 붕따우 광장 → 시내 투어", fromQ: "Vung Tau Vietnam", toQ: "Statue of Jesus Vung Tau", time: "", dist: "", note: "붕따우 성당 위치를 확인해 주세요.", todo: true, img: "" },
    { day: 2, title: "A팀 · 선월드 → 호텔", fromQ: "Sunworld Vung Tau", toQ: "Holiday Inn Resort Ho Tram Beach", time: "", dist: "", note: "", todo: true, img: "" },
    { day: 2, title: "B팀 · 시내 → 호텔", fromQ: "Vung Tau Vietnam", toQ: "Holiday Inn Resort Ho Tram Beach", time: "", dist: "", note: "", todo: true, img: "" },
    { day: 3, title: "호텔 → 송빈 성당", fromQ: "Holiday Inn Resort Ho Tram Beach", toQ: "Song Vinh Church", time: "", dist: "", note: "", todo: true, img: "" },
    { day: 3, title: "송빈 성당 → 강남BBQ / 미각", fromQ: "Song Vinh Church", toQ: "Gangnam BBQ Ho Chi Minh City", time: "", dist: "", note: "식당의 정확한 위치를 확인해 주세요.", todo: true, img: "" },
    { day: 3, title: "A팀 · 전쟁박물관 → 역사박물관", fromQ: "War Remnants Museum Ho Chi Minh City", toQ: "Museum of Vietnamese History Ho Chi Minh City", time: "", dist: "", note: "", todo: true, img: "" },
    { day: 3, title: "B팀 · 역사박물관 → 전쟁박물관", fromQ: "Museum of Vietnamese History Ho Chi Minh City", toQ: "War Remnants Museum Ho Chi Minh City", time: "", dist: "", note: "", todo: true, img: "" },
    { day: 3, title: "박물관 → 공항 주차장", fromQ: "War Remnants Museum Ho Chi Minh City", toQ: "Tan Son Nhat International Airport", time: "", dist: "", note: "주차장 위치를 확인해 주세요.", todo: true, img: "" },
    { day: 3, title: "주차장 → 공항 터미널", fromQ: "Tan Son Nhat International Airport", toQ: "Tan Son Nhat International Airport Terminal", time: "", dist: "", note: "", todo: true, img: "" }
  ],

  learn: [
    {
      name: "통일궁", en: "Reunification Palace", img: "assets/learn/palace.jpg",
      summary: "남베트남 대통령이 사용하던 건물이에요. 전쟁이 끝난 장면이 남아 있는 곳이에요.",
      topics: [
        { title: "이름의 역사", body: "원래는 남베트남 대통령이 일하던 '독립궁'이었어요. 1975년 전쟁이 끝난 뒤 '통일궁'이라는 이름으로 바뀌었어요." },
        { title: "1975년 4월 30일", body: "북베트남 군 탱크가 이 건물의 정문을 뚫고 들어가면서 사이공이 함락되었고, 베트남 전쟁이 사실상 끝났어요." },
        { title: "지하 벙커와 상황실", body: "지하에는 작전 상황실과 통신실이 있어요. 당시의 모습이 보존되어 있어요." },
        { title: "관람 팁", body: "관람 시간이 길지 않아요. 넓은 정원과 앞마당에 전시된 탱크도 놓치지 마세요." }
      ]
    },
    {
      name: "전쟁박물관", en: "War Remnants Museum", img: "assets/learn/war.jpg",
      summary: "베트남 전쟁의 모습과 피해를 사진과 자료로 보여주는 박물관이에요.",
      topics: [
        { title: "어떤 곳인가요?", body: "베트남 전쟁(베트남에서는 '미국 전쟁'이라고도 불러요)을 기록한 박물관이에요. 1975년에 문을 열었어요." },
        { title: "야외 전시", body: "전투기, 탱크, 헬리콥터 같은 무기가 마당에 전시되어 있어요." },
        { title: "사진 전시", body: "여러 나라 사진기자들이 찍은 전쟁 사진이 전시되어 있어요. 마음이 무거울 수 있으니 천천히 보세요." },
        { title: "관람 태도", body: "전쟁으로 고통받은 사람들을 기억하는 곳이에요. 조용히, 존중하는 마음으로 관람해요." }
      ]
    },
    {
      name: "역사박물관", en: "Museum of Vietnamese History", img: "assets/learn/history.jpg",
      summary: "베트남의 역사와 문화를 유물로 만날 수 있는 박물관이에요.",
      topics: [
        { title: "어떤 곳인가요?", body: "선사시대부터 근현대까지 베트남의 역사와 문화를 유물로 보여주는 박물관이에요. 1929년에 처음 문을 열었어요." },
        { title: "볼거리", body: "도자기, 불상, 청동 유물 같은 다양한 전시가 있어요. 소수민족의 생활 모습도 볼 수 있어요." },
        { title: "건물 이야기", body: "프랑스 식민지 시절에 지어진 건물이에요. 동양과 서양의 느낌이 섞인 모습이 독특해요." }
      ]
    }
  ],

  quiz: [
    { q: "통일궁은 예전에 남베트남 대통령이 사용하던 건물이다.", a: true, exp: "맞아요. 옛 이름은 '독립궁'이에요." },
    { q: "1975년 4월 30일, 북베트남 군 탱크가 통일궁 정문을 통과했다.", a: true, exp: "맞아요. 이 장면으로 전쟁이 사실상 끝났어요." },
    { q: "베트남의 수도는 호치민시이다.", a: false, exp: "틀려요. 수도는 하노이예요." },
    { q: "호치민시의 옛 이름은 '사이공'이다.", a: true, exp: "맞아요." },
    { q: "베트남은 한국과 같은 시간대를 쓴다.", a: false, exp: "틀려요. 베트남은 한국보다 2시간 느려요." },
    { q: "베트남의 화폐 단위는 '동(VND)'이다.", a: true, exp: "맞아요." },
    { q: "전쟁박물관은 베트남 전쟁에 관한 전시를 하는 곳이다.", a: true, exp: "맞아요." },
    { q: "역사박물관에서는 선사시대부터 근현대까지의 베트남 역사를 볼 수 있다.", a: true, exp: "맞아요." },
    { q: "붕따우는 바닷가에 있는 도시이다.", a: true, exp: "맞아요. 이번 수학여행의 숙소도 바닷가 쪽에 있어요." },
    { q: "하노이에서 호치민까지 비행기로 약 10시간 걸린다.", a: false, exp: "틀려요. 약 2시간 정도 걸려요." }
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
    home: { desc: "호치민과 붕따우에서 보내는 2박 3일! 일정, 공지, 사진을 한 곳에서 확인해요." },
    teams: {}
  }
};
