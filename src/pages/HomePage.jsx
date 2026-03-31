import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CartIcon from "../components/CartIcon";
import CartDrawer from "../components/CartDrawer";
import { scaleLinear } from "d3-scale";

const trailChunks = [
  {
    id: "01",
    band: "Far East",
    title: "Kanchenjunga Region",
    style: "Remote",
    elevation: "5,143 m (Pangpema)",
    season: "Oct–Nov / Mar–May",
    permit: "Restricted area permit + Kanchenjunga Conservation Area",
    places: [
      {
        name: "North Base Camp (Pangpema) Trek",
        days: "18-20",
        km: "155",
        highlight: "Third-highest mountain seen from 5,143 m viewpoint",
        stages: [
          { title: "Kathmandu to Taplejung", days: "1-2", detail: "Fly to Bhadrapur then drive 10-12 hrs, or fly Kathmandu–Suketar airstrip. Arrange permits and porter logistics in Taplejung bazaar." },
          { title: "Taplejung to Chirwa via Mitlung", days: "3-4", detail: "Descend through subtropical forest and rice terraces along the Tamur River. Cross suspension bridges at Mitlung (920 m) and continue to Chirwa (1,270 m)." },
          { title: "Chirwa to Gyabla", days: "5-6", detail: "Climb through Sekathum (1,660 m) and Amjilosa (2,510 m). Rhododendron and bamboo forest zone. Trail narrows with steep switchbacks." },
          { title: "Gyabla to Ghunsa", days: "7-8", detail: "Reach Ghunsa (3,595 m), the main Tibetan-style settlement with a gompa. Critical acclimatization stop — spend a rest day here." },
          { title: "Ghunsa to Khambachen", days: "9-10", detail: "Follow the Ghunsa Khola through yak pastures and moraines. Khambachen (4,050 m) offers views of Jannu (Kumbhakarna, 7,710 m)." },
          { title: "Khambachen to Lhonak", days: "11-12", detail: "Enter the high glacial zone. Cross lateral moraines to Lhonak (4,780 m). Sparse vegetation, cold camps, essential acclimatization." },
          { title: "Lhonak to Pangpema Base Camp", days: "13", detail: "Ascend to Pangpema (5,143 m) at the foot of the Kanchenjunga glacier. Panoramic views of the north face and Wedge Peak." },
          { title: "Descent and exit to Taplejung", days: "14-20", detail: "Retrace route with faster pacing. Possible variation via Sele La (4,290 m) for different valley views. Drive or fly out from Taplejung." },
        ],
      },
      {
        name: "South Base Camp (Oktang) Trek",
        days: "14-16",
        km: "130",
        highlight: "Yalung glacier and Kanchenjunga south face at 4,730 m",
        stages: [
          { title: "Taplejung to Yamphudin", days: "1-3", detail: "Pass through Limbu and Rai villages. Descend to the Kabeli Khola valley then climb to Yamphudin (2,080 m). Cardamom plantations and subtropical forest." },
          { title: "Yamphudin to Torontan", days: "4-5", detail: "Cross Dhupi Bhanjyang (2,540 m) and Lamite Bhanjyang (3,530 m) passes through dense rhododendron forest. Camp at Torontan (3,090 m)." },
          { title: "Torontan to Ramche", days: "6-7", detail: "Climb alongside the Simbuwa Khola. Reach Tseram (3,870 m) then Ramche (4,360 m) with views of Rathong and Koktangri peaks." },
          { title: "Ramche to Oktang viewpoint", days: "8-9", detail: "Day hike to Oktang (4,730 m) below the Yalung glacier. Direct views of Kanchenjunga's massive south face and icefall." },
          { title: "Descent to Taplejung", days: "10-16", detail: "Return via Yamphudin or connect north via Mirgin La (4,480 m) to Ghunsa on the north route for a full circuit possibility." },
        ],
      },
      {
        name: "Full Kanchenjunga Circuit",
        days: "24-28",
        km: "280",
        highlight: "Both base camps linked via Sele La and Mirgin La passes",
        stages: [
          { title: "North approach to Pangpema", days: "1-12", detail: "Follow the north base camp route through Ghunsa and Lhonak to reach Pangpema (5,143 m). Full acclimatization program at Ghunsa." },
          { title: "Pangpema to Ghunsa return", days: "13-14", detail: "Descend from base camp. Rest day in Ghunsa to prepare for the southern crossing." },
          { title: "Ghunsa to Tseram via Sele La / Mirgin La", days: "15-19", detail: "Cross Sele La (4,290 m) and Mirgin La (4,480 m). Remote and demanding section linking north and south valleys. No settlements between." },
          { title: "Tseram to Oktang and south base", days: "20-22", detail: "Explore the Yalung side and the south face viewpoints at Oktang (4,730 m). Camp at Ramche for sunrise views." },
          { title: "Return via Yamphudin to Taplejung", days: "23-28", detail: "Descend through the southern valley past Torontan and Yamphudin. Transfer to Taplejung for flights or drive out." },
        ],
      },
      {
        name: "Nango La Connector (to Makalu)",
        days: "7-9",
        km: "85",
        highlight: "Links Kanchenjunga to Makalu trail system via remote high pass",
        stages: [
          { title: "Ghunsa to Nango La Base Camp", days: "1-2", detail: "Leave Ghunsa heading west. Ascend through high pasture and moraine. Camp below Nango La at approximately 4,600 m." },
          { title: "Nango La crossing (4,776 m)", days: "3", detail: "Cross the Nango La pass — one of the most remote crossings in eastern Nepal. Steep descent on loose scree into the Tamur headwaters." },
          { title: "Descent to Olangchun Gola", days: "4-5", detail: "Reach Olangchun Gola (3,191 m), an ancient trading village at the Tibet border. Tibetan-influenced architecture and culture." },
          { title: "Olangchun to Chyamtang via Lumbha Sambha", days: "6-9", detail: "Cross Lumbha Sambha La (5,160 m). Challenging pass requiring ropes and good weather. Enter the Makalu-Barun watershed." },
        ],
      },
    ],
  },
  {
    id: "02",
    band: "Eastern High Valleys",
    title: "Makalu-Barun",
    style: "Remote",
    elevation: "5,050 m (Makalu BC)",
    season: "Oct–Nov / Apr–May",
    permit: "Makalu-Barun National Park entry",
    places: [
      {
        name: "Makalu Base Camp Trek",
        days: "18-20",
        km: "140",
        highlight: "Face-to-face with the world's fifth-highest peak at 5,050 m",
        stages: [
          { title: "Tumlingtar to Num", days: "1-2", detail: "Fly to Tumlingtar (450 m) from Kathmandu. Drive or hike to Num (1,560 m), the gateway village on a ridge above the Arun River." },
          { title: "Num to Seduwa via Arun Valley", days: "3-4", detail: "Steep descent to the Arun River (760 m), the deepest valley in Nepal. Cross the river and climb to Seduwa (1,500 m) through Rai and Sherpa farmland." },
          { title: "Seduwa to Tashigaon", days: "5-6", detail: "Ascend through dense forest to Tashigaon (2,100 m), the last permanent village. Stock up on supplies — no settlements ahead." },
          { title: "Tashigaon to Khongma La (3,960 m)", days: "7-8", detail: "Steep climb through moss-draped cloud forest. Cross Khongma La — the gateway to the Barun Valley. Sharp descent into the upper valley." },
          { title: "Khongma La to Makalu Base Camp", days: "9-12", detail: "Traverse the spectacular Barun Valley floor. Pass Langmale Kharka (4,410 m), then Sherson (4,615 m). Reach base camp (5,050 m) below Makalu's south face." },
          { title: "Return via same route", days: "13-20", detail: "Retrace the route. Possible detour via Hillary Base Camp (4,700 m) for alternative views of the Barun glacier and Chamlang peak." },
        ],
      },
      {
        name: "Barun Valley and Sherpani Col Crossing",
        days: "20-25",
        km: "110",
        estimated: true,
        highlight: "Technical alpine crossing to Everest region via 6,135 m pass",
        stages: [
          { title: "Makalu BC to Advanced Base Camp", days: "1-3", detail: "From Makalu base camp ascend toward the upper glacier. Establish camp at around 5,400 m at the Barun glacier head." },
          { title: "Sherpani Col (6,135 m)", days: "4-5", detail: "Full mountaineering crossing requiring fixed ropes, crampons, and harnesses. Exposed traverse at over 6,000 m. One of GHT's most technical sections." },
          { title: "West Col (6,190 m) to Baruntse BC", days: "6-7", detail: "Continue over West Col — another glaciated pass. Descend the Hongku Basin toward the Everest region. Crevasse danger requires roped travel." },
          { title: "Descent to Lukla via Mingbo La or valleys", days: "8-25", detail: "Multiple exit options: via Amphu Laptsa (5,845 m) to Chhukung, or through the Honku valley to Mera Peak area. All require expedition judgment." },
        ],
      },
      {
        name: "Arun Valley Cultural Trek",
        days: "10-12",
        km: "95",
        highlight: "Deep subtropical valley with Rai and Sherpa communities",
        stages: [
          { title: "Tumlingtar to Khandbari", days: "1-2", detail: "Walk or drive to Khandbari (1,040 m), the district capital of Sankhuwasabha. Visit the Saturday market and ancient pipal tree." },
          { title: "Khandbari to Num ridge walk", days: "3-5", detail: "Follow the ridge trail with views into the Arun gorge. Pass through Bhotebas (Sherpa settlement) and Limbu farming communities." },
          { title: "Num to Seduwa and lower Barun approach", days: "6-8", detail: "Descend to the Arun River canyon — one of Nepal's most dramatic altitude drops. Subtropical to temperate transition within hours." },
          { title: "Return or connect to Makalu route", days: "9-12", detail: "Return to Tumlingtar or continue toward Tashigaon to begin the full Makalu Base Camp approach." },
        ],
      },
    ],
  },
  {
    id: "03",
    band: "Khumbu",
    title: "Everest Section",
    style: "Popular",
    elevation: "5,535 m (Kongma La)",
    season: "Oct–Nov / Mar–May",
    permit: "Sagarmatha National Park + TIMS card",
    places: [
      {
        name: "Everest Base Camp Classic",
        days: "12-14",
        km: "130",
        highlight: "Khumbu Icefall views at 5,364 m, Kala Patthar sunrise at 5,644 m",
        stages: [
          { title: "Kathmandu to Lukla, trek to Phakding", days: "1", detail: "Fly to Lukla (2,860 m) on one of the world's most dramatic airstrips. Descend through Cheplung to Phakding (2,610 m) along the Dudh Kosi." },
          { title: "Phakding to Namche Bazaar", days: "2", detail: "Cross multiple suspension bridges. Steep climb from the Hillary Bridge to Namche Bazaar (3,440 m), the Sherpa capital and trading hub." },
          { title: "Namche acclimatization day", days: "3", detail: "Day hike to Everest View Hotel (3,880 m) or the Sherpa Culture Museum. Essential to prevent altitude sickness before climbing higher." },
          { title: "Namche to Tengboche", days: "4", detail: "Traverse to Tengboche (3,867 m) and its iconic Buddhist monastery. First direct views of Everest, Nuptse, Lhotse, and Ama Dablam." },
          { title: "Tengboche to Dingboche", days: "5", detail: "Descend through Pangboche (oldest gompa in Khumbu), then climb to Dingboche (4,410 m) in the Imja Khola valley." },
          { title: "Acclimatization in Dingboche", days: "6", detail: "Day hike to Nagarjun Hill (5,050 m) for views of Makalu, Island Peak, and the Lhotse wall. Critical rest before high altitude." },
          { title: "Dingboche to Lobuche", days: "7", detail: "Walk the Khumbu glacier lateral moraine. Pass the Thukla memorial cairns honoring fallen climbers. Reach Lobuche (4,940 m)." },
          { title: "Lobuche to Gorak Shep and EBC", days: "8", detail: "Reach Gorak Shep (5,164 m). Continue to Everest Base Camp (5,364 m) on the Khumbu glacier. See the icefall up close." },
          { title: "Kala Patthar sunrise and descent", days: "9-10", detail: "Pre-dawn climb to Kala Patthar (5,644 m) for the best sunrise panorama of Everest. Descend rapidly to Pheriche or Pangboche." },
          { title: "Return to Lukla and fly out", days: "11-14", detail: "Quick descent through Namche to Lukla. Buffer days for weather delays on flights — Lukla delays are common." },
        ],
      },
      {
        name: "Three Passes Trek (Kongma La, Cho La, Renjo La)",
        days: "18-21",
        km: "170",
        highlight: "Three 5,300+ m passes ringing the Khumbu with Gokyo Lakes",
        stages: [
          { title: "Lukla to Namche and acclimatize", days: "1-3", detail: "Standard approach to Namche Bazaar with acclimatization day. Same as EBC beginning." },
          { title: "Namche to Dingboche", days: "4-5", detail: "Via Tengboche monastery. Acclimatize in Dingboche with day hike." },
          { title: "Kongma La (5,535 m)", days: "6-7", detail: "First and often hardest pass — scramble over glacial terrain from Dingboche to Lobuche. Requires early start and clear weather." },
          { title: "EBC and Kala Patthar", days: "8-9", detail: "Side trip to base camp and sunrise viewpoint. Return to Lobuche or Dzongla." },
          { title: "Cho La (5,420 m)", days: "10-11", detail: "Cross from Dzongla over the glaciated Cho La. Crampons may be needed. Steep descent to Gokyo valley via Thagna." },
          { title: "Gokyo Lakes and Gokyo Ri", days: "12-14", detail: "Explore the turquoise Gokyo Lakes (4,700-4,800 m). Climb Gokyo Ri (5,357 m) for panoramic views of Everest, Cho Oyu, Lhotse, and Makalu." },
          { title: "Renjo La (5,360 m) and descent", days: "15-17", detail: "Cross Renjo La with views over Gokyo lakes behind and the Bhote Kosi valley ahead. Descend to Thame and Namche." },
          { title: "Namche to Lukla and fly out", days: "18-21", detail: "Final descent with weather buffer days." },
        ],
      },
      {
        name: "Gokyo Lakes Trek",
        days: "12-14",
        km: "115",
        highlight: "Turquoise glacial lakes and Gokyo Ri panorama of four 8,000 m peaks",
        stages: [
          { title: "Lukla to Namche Bazaar", days: "1-3", detail: "Standard Khumbu approach with acclimatization day in Namche." },
          { title: "Namche to Dole via upper route", days: "4-5", detail: "Bypass the Tengboche route. Take the upper trail through Mong La (3,973 m) to Dole (4,200 m) with views of Cho Oyu and Thamserku." },
          { title: "Dole to Gokyo via Machherma", days: "6-7", detail: "Gradual ascent through Machherma (4,470 m) and past Dudh Pokhari to Gokyo (4,790 m) on the shore of the Third Lake." },
          { title: "Gokyo Ri and lake exploration", days: "8-9", detail: "Climb Gokyo Ri (5,357 m) for sunrise. Visit the Fourth and Fifth Lakes (4,800-4,990 m). Optional hike toward Cho Oyu base camp." },
          { title: "Return to Lukla", days: "10-14", detail: "Descend through Machherma and Dole to Namche. Continue to Lukla with flight buffer." },
        ],
      },
      {
        name: "Island Peak (Imja Tse) Extension",
        days: "4-5",
        km: "30",
        estimated: true,
        highlight: "6,189 m trekking peak with fixed-rope summit day",
        stages: [
          { title: "Dingboche to Island Peak Base Camp", days: "1", detail: "From Dingboche follow the Imja Khola to Island Peak base camp (5,087 m). Afternoon gear check and briefing." },
          { title: "Base Camp to High Camp", days: "2", detail: "Ascend rocky moraine to high camp (5,600 m). Brief climbing rope practice on nearby ice." },
          { title: "Summit day (6,189 m)", days: "3", detail: "Alpine start at 2-3 AM. Cross the glacier, ascend fixed ropes on the headwall. Summit offers 360° views of Lhotse, Makalu, and Baruntse." },
          { title: "Descent to Chhukung", days: "4-5", detail: "Descend to Chhukung (4,730 m). Rejoin the main EBC trail at Dingboche or Pheriche." },
        ],
      },
    ],
  },
  {
    id: "04",
    band: "East-Central Transition",
    title: "Rolwaling Valley",
    style: "Advanced",
    elevation: "5,755 m (Tashi Lapcha)",
    season: "Oct–Nov / Apr–May",
    permit: "Gaurishankar Conservation Area",
    places: [
      {
        name: "Rolwaling Valley to Tashi Lapcha Pass",
        days: "14-18",
        km: "115",
        highlight: "Dramatic glacier crossing at 5,755 m linking Rolwaling to Khumbu",
        stages: [
          { title: "Kathmandu to Singati or Chhetchhet", days: "1-2", detail: "Drive 8-10 hrs east via Charikot to Singati (960 m) or Chhetchhet. Road quality varies — landslides common in monsoon aftermath." },
          { title: "Singati to Simigaon", days: "3-4", detail: "Climb from the Sun Kosi valley through terraced farmland to Simigaon (2,000 m), a Sherpa village with views of Gauri Shankar (7,134 m)." },
          { title: "Simigaon to Beding", days: "5-6", detail: "Follow the Rolwaling Chu upstream through dense bamboo and rhododendron forest. Beding (3,693 m) is the main Rolwaling Sherpa village with a monastery." },
          { title: "Beding to Na and Tsho Rolpa", days: "7-8", detail: "Ascend to Na (4,180 m) and visit Tsho Rolpa lake (4,580 m), one of Nepal's largest glacial lakes. Acclimatization day here." },
          { title: "Na to Tashi Lapcha Base Camp", days: "9-10", detail: "Climb the steep moraine to the Drolambau glacier. Camp at approximately 5,200 m below the pass. Technical section begins." },
          { title: "Tashi Lapcha Pass (5,755 m)", days: "11-12", detail: "Cross the pass — fixed ropes, crampons, and ice axes required. Steep snow/ice on both sides. Descend to the Khumbu side." },
          { title: "Descent to Thame and Namche", days: "13-18", detail: "Emerge at Thame (3,820 m) in the Khumbu. Continue to Namche Bazaar. Option to extend into EBC or Three Passes trek." },
        ],
      },
      {
        name: "Tsho Rolpa Lake Trek",
        days: "9-11",
        km: "80",
        highlight: "Glacial lake at 4,580 m below the Rolwaling peaks",
        stages: [
          { title: "Kathmandu to Singati", days: "1-2", detail: "Drive to the Rolwaling trailhead. Arrange local guide — route is seldom used and trail markers are sparse." },
          { title: "Singati to Beding", days: "3-5", detail: "Climb steadily through the lower Rolwaling Valley. Pass Jagat, Shakpa, and Nyimare settlements. Arrive in Beding (3,693 m)." },
          { title: "Beding to Tsho Rolpa and back", days: "6-8", detail: "Day trips to Na (4,180 m) and the lake shore. Explore the moraine dam and glacier viewpoints." },
          { title: "Return to Kathmandu", days: "9-11", detail: "Descend the same route to Singati. Drive back to Kathmandu." },
        ],
      },
      {
        name: "Gaurishankar Base Camp Approach",
        days: "8-10",
        km: "65",
        estimated: true,
        highlight: "Approach trek beneath the sacred twin-peaked Gauri Shankar (7,134 m)",
        stages: [
          { title: "Chhetchhet to Lamabagar", days: "1-3", detail: "Follow the Tama Kosi valley upstream through sub-tropical forests. Pass Tibetan-influenced villages. Lamabagar (2,940 m) is the last settlement." },
          { title: "Lamabagar to base camp area", days: "4-6", detail: "Continue into the upper valley toward the Gaurishankar massif. Camping only — no lodges. Views of the south face route." },
          { title: "Return to roadhead", days: "7-10", detail: "Retrace the approach. Possible connection toward Simigaon and the Rolwaling Valley." },
        ],
      },
    ],
  },
  {
    id: "05",
    band: "Central Nepal",
    title: "Helambu-Langtang",
    style: "Popular",
    elevation: "4,610 m (Laurebina La)",
    season: "Oct–Nov / Mar–May",
    permit: "Langtang National Park + TIMS card",
    places: [
      {
        name: "Langtang Valley Trek",
        days: "10-12",
        km: "65",
        highlight: "Langtang Lirung (7,234 m) views and Kyanjin Gompa cheese factory",
        stages: [
          { title: "Kathmandu to Syabrubesi", days: "1", detail: "Drive 7-8 hrs through Trisuli Bazaar to Syabrubesi (1,550 m). Improved road via Dunche but still prone to landslides." },
          { title: "Syabrubesi to Lama Hotel", days: "2", detail: "Enter Langtang National Park. Climb through bamboo and oak forest along the Langtang Khola. Spot langur monkeys and red pandas." },
          { title: "Lama Hotel to Langtang Village", days: "3", detail: "Continue ascending through rhododendron forest. Reach Langtang Village (3,430 m), rebuilt after the 2015 earthquake landslide." },
          { title: "Langtang Village to Kyanjin Gompa", days: "4", detail: "Gentle walk to Kyanjin Gompa (3,870 m). Visit the cheese factory (Swiss dairy project) and the small monastery." },
          { title: "Kyanjin Ri or Tserko Ri day hike", days: "5", detail: "Climb Kyanjin Ri (4,773 m, 3 hrs) or the strenuous Tserko Ri (5,033 m, 5-6 hrs) for panoramas of Langtang Lirung, Yala Peak, and the Tibet border." },
          { title: "Return to Syabrubesi", days: "6-8", detail: "Descend the same valley. Fast descent possible in 2 days. Drive back to Kathmandu." },
        ],
      },
      {
        name: "Langtang–Gosaikunda–Helambu",
        days: "15-18",
        km: "110",
        highlight: "Sacred alpine lakes and Tamang heritage villages across three valleys",
        stages: [
          { title: "Syabrubesi to Kyanjin Gompa", days: "1-5", detail: "Follow the standard Langtang Valley trek. Explore Kyanjin area." },
          { title: "Return to Lama Hotel, then to Thulo Syabru", days: "6-7", detail: "Descend the valley. At the junction near Rimche, take the trail climbing to Thulo Syabru (2,230 m)." },
          { title: "Thulo Syabru to Gosaikunda Lakes", days: "8-10", detail: "Climb through forests to Sing Gompa (3,250 m) then Laurebina (3,910 m). Reach Gosaikunda (4,380 m), a sacred Hindu lake surrounded by mountains." },
          { title: "Gosaikunda to Ghopte via Laurebina La", days: "11-12", detail: "Cross Laurebina La (4,610 m) — highest point. Descend through rocky terrain to Phedi and Ghopte (3,430 m)." },
          { title: "Ghopte to Helambu (Tharepati to Sermathang)", days: "13-15", detail: "Pass through Tharepati and descend into the Helambu region. Visit Melamchighyang and Sermathang — traditional Tamang/Hyolmo villages." },
          { title: "Sermathang to Kathmandu", days: "16-18", detail: "Descend to Melamchi Bazaar. Drive 2-3 hours back to Kathmandu." },
        ],
      },
      {
        name: "Gosaikunda Sacred Lakes Trek",
        days: "7-9",
        km: "55",
        highlight: "Hindu pilgrimage lakes at 4,380 m — frozen in winter, ceremonial in Janai Purnima",
        stages: [
          { title: "Drive to Dhunche, trek to Sing Gompa", days: "1-2", detail: "Drive from Kathmandu to Dhunche (1,960 m). Climb through pine and rhododendron to Sing Gompa (3,250 m) with its old cheese factory." },
          { title: "Sing Gompa to Gosaikunda", days: "3-4", detail: "Ascend above treeline. Pass Saraswati Kunda and Bhairab Kunda. Reach Gosaikunda (4,380 m) — 108 lakes scattered across the alpine basin." },
          { title: "Lake exploration and return", days: "5-7", detail: "Optional: cross Laurebina La (4,610 m) to connect to Helambu. Or return to Dhunche the same way." },
          { title: "Drive to Kathmandu", days: "8-9", detail: "Return drive from Dhunche." },
        ],
      },
      {
        name: "Tamang Heritage Trail",
        days: "5-7",
        km: "50",
        highlight: "Tamang culture, stone villages, and Langtang Himal views from the west",
        stages: [
          { title: "Syabrubesi to Gatlang", days: "1-2", detail: "Follow the western ridgeline trail to Gatlang (2,300 m), an authentic Tamang village with slate-roofed stone houses and a water-powered mill." },
          { title: "Gatlang to Tatopani to Thuman", days: "3-4", detail: "Visit natural hot springs at Tatopani. Continue to Thuman (2,100 m), another well-preserved Tamang settlement with a monastery." },
          { title: "Thuman to Briddim to Syabrubesi", days: "5-7", detail: "Pass through Briddim (a Tibetan refugee village) and loop back to Syabrubesi. Possible extension into the main Langtang Valley." },
        ],
      },
    ],
  },
  {
    id: "06",
    band: "Central High Route",
    title: "Ganesh Himal–Manaslu",
    style: "Mixed",
    elevation: "5,160 m (Larkya La)",
    season: "Sep–Nov / Mar–May",
    permit: "Manaslu Conservation Area + restricted area permit (min 2 trekkers + guide)",
    places: [
      {
        name: "Manaslu Circuit Trek",
        days: "14-17",
        km: "177",
        highlight: "Larkya La (5,160 m) pass and views of Manaslu (8,163 m, world's 8th highest)",
        stages: [
          { title: "Kathmandu to Soti Khola", days: "1-2", detail: "Drive 7-8 hrs to Arughat Bazaar, then continue (rough road, possibly 4WD) to Soti Khola (710 m) on the Budhi Gandaki River." },
          { title: "Soti Khola to Jagat", days: "3-4", detail: "Follow the Budhi Gandaki gorge. Pass through Machha Khola (930 m) and Khorlabesi. Reach Jagat (1,340 m), the permit checkpoint." },
          { title: "Jagat to Deng to Namrung", days: "5-6", detail: "Enter the restricted area. The valley narrows dramatically. Pass Philim (Gurung village) and Deng (1,860 m). Reach Namrung (2,660 m)." },
          { title: "Namrung to Samagaon", days: "7-8", detail: "Enter the tibetan Buddhist cultural zone. Reach Samagaon (3,530 m) with its monastery and views of Manaslu's south face." },
          { title: "Samagaon acclimatization", days: "9", detail: "Rest day. Optional hike to Manaslu Base Camp (4,400 m) or Birendra Tal glacial lake. View the Manaslu glacier cascade." },
          { title: "Samagaon to Samdo", days: "10", detail: "Climb to Samdo (3,860 m), the last village. Tibetan border trading post. Optional day hike toward Larkya Glacier." },
          { title: "Larkya La crossing (5,160 m)", days: "11-12", detail: "Long day crossing the pass. Depart before dawn. Gradual ascent across moraine and snow. Panoramic views of Himlung, Cheo, and Annapurna II. Steep descent to Bimthang (3,710 m)." },
          { title: "Bimthang to Dharapani", days: "13-14", detail: "Descend through pine forests to Tilije (2,300 m) and Dharapani (1,860 m) on the Annapurna Circuit. Culture shifts from Tibetan to Gurung." },
          { title: "Dharapani to Besisahar and drive out", days: "15-17", detail: "Follow the Marsyangdi River valley. Drive from Besisahar (760 m) back to Kathmandu (6-7 hrs)." },
        ],
      },
      {
        name: "Tsum Valley Trek",
        days: "10-14",
        km: "90",
        highlight: "Pristine Tibetan Buddhist valley — Nepal's 'Hidden Valley of Happiness'",
        stages: [
          { title: "Soti Khola to Lokpa", days: "1-3", detail: "Follow the lower Manaslu trail along the Budhi Gandaki. Turn north into the Tsum Valley at Chumling. Reach Lokpa (2,240 m)." },
          { title: "Lokpa to Chhokang Paro", days: "4-5", detail: "Enter the upper Tsum Valley. Chhokang Paro (3,010 m) has a famous stupa and mani walls. Tibetan culture is completely preserved." },
          { title: "Chhokang Paro to Mu Gompa", days: "6-8", detail: "Continue to Nile (3,361 m) and the sacred Mu Gompa (3,700 m), one of Nepal's largest and most important nunneries. Views of Ganesh Himal." },
          { title: "Explore upper Tsum and return", days: "9-11", detail: "Visit Rachen Gompa and Milarepa's meditation caves. Retrace the route south." },
          { title: "Exit via Budhi Gandaki or join Manaslu Circuit", days: "12-14", detail: "Return to the main trail. Either exit or continue north to join the Manaslu Circuit at Philim/Deng." },
        ],
      },
      {
        name: "Ganesh Himal Trek (Ruby Valley)",
        days: "10-12",
        km: "80",
        estimated: true,
        highlight: "Rarely visited route past the Ganesh Himal range through Tamang villages",
        stages: [
          { title: "Kathmandu to Shyabru or Betrawati", days: "1-2", detail: "Drive to the trailhead northwest of Kathmandu. Enter through Gurung and Tamang farmland." },
          { title: "Approach through Ruby Valley", days: "3-5", detail: "Named for corundum (ruby) deposits. Trek through Tamang villages of Rupchet and Tipling (2,078 m). Minimal tourist infrastructure." },
          { title: "High camp below Ganesh Himal", days: "6-8", detail: "Climb to alpine pastures (3,800-4,200 m) with direct views of Ganesh I-IV (7,422 m chain). Possible Singla Pass crossing." },
          { title: "Return or connect to Manaslu", days: "9-12", detail: "Descend back to the roadhead. At Singla Pass, experienced trekkers can connect to the Manaslu restricted area." },
        ],
      },
    ],
  },
  {
    id: "07",
    band: "West-Central",
    title: "Annapurna Section",
    style: "Popular",
    elevation: "5,416 m (Thorong La)",
    season: "Oct–Nov / Mar–May",
    permit: "Annapurna Conservation Area + TIMS card",
    places: [
      {
        name: "Annapurna Circuit",
        days: "12-21",
        km: "160-230",
        highlight: "Thorong La (5,416 m) — the world's most famous high pass, and Muktinath temple",
        stages: [
          { title: "Kathmandu to Besisahar to Chame", days: "1-4", detail: "Drive to Besisahar (760 m). Continue by jeep or trek through Bahundanda, Tal, and Dharapani along the Marsyangdi River to Chame (2,670 m), Manang district HQ." },
          { title: "Chame to Manang via Pisang", days: "5-6", detail: "Enter the rain shadow zone — dry Tibetan landscape. Pass Upper Pisang (3,300 m) with its cliffside monastery. Reach Manang (3,519 m)." },
          { title: "Manang acclimatization", days: "7", detail: "Explore the Gangapurna glacier lake, visit Braga monastery (500+ years old), or hike to Praken Gompa. Essential acclimatization." },
          { title: "Manang to Thorong High Camp", days: "8-9", detail: "Gradual ascent via Yak Kharka (4,018 m) to Thorong Phedi (4,525 m) then High Camp (4,850 m). Prepare for the pass." },
          { title: "Thorong La (5,416 m) to Muktinath", days: "10", detail: "Start 4-5 AM. Cross the pass in 4-5 hrs. Panoramic views of Dhaulagiri (8,167 m) and the Kali Gandaki. Steep descent to Muktinath (3,800 m), sacred to both Hindus and Buddhists." },
          { title: "Muktinath to Tatopani or Jomsom", days: "11-14", detail: "Descend through Kagbeni (Mustang gateway) and the Kali Gandaki gorge — one of the world's deepest. Soak in Tatopani hot springs (1,190 m). Or fly from Jomsom." },
          { title: "Tatopani to Pokhara via Ghorepani", days: "15-21", detail: "Optional extension over Poon Hill (3,210 m) for Annapurna-Dhaulagiri sunrise. Descend through Birethanti to Nayapul. Bus to Pokhara." },
        ],
      },
      {
        name: "Annapurna Base Camp (ABC) Trek",
        days: "8-12",
        km: "75",
        highlight: "360° amphitheatre of Annapurna I (8,091 m), Machapuchare, and Hiunchuli",
        stages: [
          { title: "Pokhara to Ghandruk or Chhomrong", days: "1-3", detail: "Drive to Nayapul (1,070 m). Trek through Gurung villages of Ghandruk (1,940 m) and the stone staircase descent/ascent to Chhomrong (2,170 m)." },
          { title: "Chhomrong to Deurali", days: "4-5", detail: "Enter the Modi Khola gorge. Pass through Bamboo (2,310 m) and Himalaya Hotel (2,920 m) to Deurali (3,230 m). Dense bamboo gives way to alpine." },
          { title: "Deurali to Annapurna Base Camp", days: "6-7", detail: "Cross the Machhapuchare Base Camp (3,700 m) to reach ABC (4,130 m). Sunrise inside the Annapurna Sanctuary — a 360° mountain amphitheatre." },
          { title: "Return to Pokhara", days: "8-12", detail: "Descend the same route. Option to exit via Ghorepani and Poon Hill for a different descent." },
        ],
      },
      {
        name: "Nar-Phu Valley Side Trek",
        days: "5-7",
        km: "55",
        highlight: "Hidden Tibetan valley with 900-year-old Nar village and Kang La pass",
        stages: [
          { title: "Koto to Meta (Phu Valley entrance)", days: "1-2", detail: "Branch off the Annapurna Circuit at Koto (2,600 m). Enter the restricted Nar-Phu area. Trek through a dramatic narrow gorge to Meta (3,560 m)." },
          { title: "Meta to Phu village", days: "3", detail: "Continue to Phu (4,080 m), a remote Tibetan village carved into cliff faces. Visit the hilltop gompa and ancient caves." },
          { title: "Phu to Nar via Nar Phedi", days: "4-5", detail: "Backtrack to Kyang and cross to Nar (4,110 m). Stunning medieval village with kani gates and mani walls. Views of Annapurna II." },
          { title: "Nar to Manang via Kang La (5,306 m)", days: "6-7", detail: "Cross Kang La pass — challenging but spectacular. Rejoin the Annapurna Circuit at Ngawal or Manang." },
        ],
      },
      {
        name: "Tilicho Lake Trek",
        days: "3-4",
        km: "32",
        highlight: "One of the world's highest lakes at 4,919 m in the Annapurna massif",
        stages: [
          { title: "Manang to Tilicho Base Camp", days: "1-2", detail: "From Manang head toward Khangsar (3,734 m). Climb exposed trail along cliff edges to Tilicho Base Camp (4,150 m). Landslide-prone section." },
          { title: "Base Camp to Tilicho Lake", days: "3", detail: "Early morning ascent to Tilicho Lake (4,919 m). One of the highest lakes in the world. Surrounded by the Tilicho and Nilgiri peaks." },
          { title: "Return to Manang", days: "4", detail: "Descend to Manang and rejoin the main Annapurna Circuit for the Thorong La crossing." },
        ],
      },
      {
        name: "Poon Hill – Ghorepani Short Trek",
        days: "4-5",
        km: "40",
        highlight: "Classic Annapurna-Dhaulagiri sunrise panorama — best short trek in Nepal",
        stages: [
          { title: "Pokhara to Ghorepani via Ulleri", days: "1-2", detail: "Drive to Nayapul. Climb 3,300 stone steps to Ulleri (2,070 m) then through rhododendron forest to Ghorepani (2,874 m)." },
          { title: "Poon Hill sunrise and Tadapani", days: "3", detail: "Pre-dawn hike to Poon Hill (3,210 m). 180° panorama from Dhaulagiri to Manaslu. Descend to Tadapani (2,630 m) through mossy forest." },
          { title: "Tadapani to Pokhara", days: "4-5", detail: "Descend via Ghandruk (Gurung village) to Nayapul. Drive to Pokhara." },
        ],
      },
    ],
  },
  {
    id: "08",
    band: "Trans-Himalayan West",
    title: "Mustang–Dolpo",
    style: "Remote",
    elevation: "5,190 m (Kagmara La)",
    season: "Jun–Sep (Mustang, rain shadow) / Sep–Nov (Dolpo)",
    permit: "Restricted area permit ($500 USD for Mustang, $500 for Dolpo, per 10 days)",
    places: [
      {
        name: "Upper Mustang Circuit",
        days: "12-14",
        km: "190",
        highlight: "Walled city of Lo Manthang — medieval Tibetan kingdom frozen in time",
        stages: [
          { title: "Pokhara to Jomsom to Kagbeni", days: "1-2", detail: "Fly Pokhara to Jomsom (2,720 m) or drive. Trek to Kagbeni (2,810 m), the gateway to Upper Mustang. Check permits." },
          { title: "Kagbeni to Chele", days: "3", detail: "Enter the restricted area. Follow the Kali Gandaki river through Chhusang. Climb past red and ochre cliffs to Chele (3,050 m)." },
          { title: "Chele to Syangboche to Ghami", days: "4-5", detail: "Cross multiple passes (3,800-3,900 m). Pass through Samar and its red cliff caves. Ghami (3,520 m) has the longest mani wall in Nepal." },
          { title: "Ghami to Lo Manthang", days: "6-7", detail: "Cross Lo La (3,950 m). Arrive at Lo Manthang (3,840 m) — a walled city with four monasteries, a palace, and 150+ homes. Explore over two days." },
          { title: "Lo Manthang exploration", days: "8-9", detail: "Visit Thubchen Gompa (15th-century frescoes), Jhampa Gompa, and the Raja's Palace. Day trip to Choser caves (4,010 m) and Luri Gompa." },
          { title: "Return via western route", days: "10-12", detail: "Take the alternative western trail via Ghar Gompa and Dhi village for different views. Rejoin the main trail at Samar." },
          { title: "Kagbeni to Jomsom and fly out", days: "13-14", detail: "Return to Jomsom. Fly to Pokhara (weather-dependent, early morning flights only)." },
        ],
      },
      {
        name: "Lower Dolpo (Phoksundo Lake) Trek",
        days: "10-14",
        km: "120",
        highlight: "One of Nepal's deepest lakes (145 m) — the turquoise jewel Peter Matthiessen wrote about",
        stages: [
          { title: "Nepalgunj to Juphal", days: "1-2", detail: "Fly from Kathmandu to Nepalgunj, then fly to Juphal (2,475 m), the airstrip for Dolpo. Or drive to Surkhet and trek 4 days." },
          { title: "Juphal to Dunai to Chhepka", days: "3-4", detail: "Trek to Dunai (2,140 m), the Dolpo district capital. Continue along the Suligad valley through Kageni and upper forests." },
          { title: "Chhepka to Phoksundo Lake", days: "5-6", detail: "Climb past Nepal's tallest waterfall (167 m, seasonally). Arrive at Phoksundo Lake (3,612 m) — impossibly blue, ringed by junipers and cliffs." },
          { title: "Phoksundo exploration", days: "7-9", detail: "Explore the Bon-po village of Ringmo. Walk around the lake shore. Visit monasteries clinging to the cliffs. Optional day hike higher for aerial views." },
          { title: "Return to Juphal", days: "10-14", detail: "Retrace the route. Alternative exit via Beni if connecting to Annapurna region (long overland route)." },
        ],
      },
      {
        name: "Upper Dolpo Circuit (Shey Gompa)",
        days: "22-28",
        km: "250",
        highlight: "Inner Dolpo — Crystal Mountain, Shey Gompa, and the route of 'The Snow Leopard'",
        stages: [
          { title: "Juphal to Phoksundo Lake", days: "1-5", detail: "Standard approach via Dunai. Acclimatize at Phoksundo before entering the inner Dolpo restricted zone." },
          { title: "Phoksundo to Shey Gompa via Kang La", days: "6-10", detail: "Cross Kang La / Nagdalo La (5,100 m) into the inner Dolpo. Reach Shey Gompa (4,390 m) at the base of Crystal Mountain — sacred to Bon and Buddhist traditions." },
          { title: "Shey to Saldang via Namgung", days: "11-15", detail: "Trek through the high trans-Himalayan plateau. Visit Namgung Monastery and reach Saldang (3,770 m), one of Dolpo's most vibrant villages." },
          { title: "Saldang to Dho Tarap", days: "16-19", detail: "Cross passes to reach the broad Tarap valley. Dho Tarap (4,040 m) is a major Bon-po and Buddhist community." },
          { title: "Dho Tarap to Juphal via Kagmara La", days: "20-28", detail: "Cross Kagmara La (5,115 m) or Numa La (5,190 m) through forests back to Juphal. Some of Nepal's most remote terrain." },
        ],
      },
      {
        name: "Jomsom to Dolpo Connector",
        days: "14-18",
        km: "160",
        estimated: true,
        highlight: "Remote link between Annapurna and Dolpo through Dhaulagiri's north side",
        stages: [
          { title: "Jomsom/Kagbeni to Sangda La", days: "1-4", detail: "Leave the Kali Gandaki valley heading west. Cross Sangda La (5,020 m) into the upper Barbung Khola drainage." },
          { title: "Barbung Khola to Tarakot", days: "5-9", detail: "Follow the Barbung river through deeply remote terrain. Pass through Gurung and Magar settlements. Reach Tarakot (2,540 m)." },
          { title: "Tarakot to Dunai", days: "10-12", detail: "Continue to Dunai, the Dolpo district capital. Resupply and arrange permits for Phoksundo or Upper Dolpo." },
          { title: "Option to continue to Phoksundo", days: "13-18", detail: "Connect to the Lower or Upper Dolpo treks from Dunai." },
        ],
      },
    ],
  },
  {
    id: "09",
    band: "Far West",
    title: "Mugu–Rara–Humla",
    style: "Remote",
    elevation: "4,480 m (Chankheli Pass)",
    season: "Sep–Nov / Apr–Jun",
    permit: "Rara National Park / Humla restricted area permit",
    places: [
      {
        name: "Rara Lake Trek",
        days: "8-10",
        km: "70",
        highlight: "Nepal's largest lake (10.8 km²) — pristine alpine water at 2,990 m",
        stages: [
          { title: "Kathmandu to Jumla", days: "1-2", detail: "Fly Kathmandu–Nepalgunj–Jumla (2,370 m). Jumla is the only Karnali Zone airport. Stock up on supplies — very limited availability ahead." },
          { title: "Jumla to Sinja Valley", days: "3-4", detail: "Trek north through the historic Sinja Valley — capital of the medieval Khasa Malla kingdom and birthplace of the Nepali language. Pass through pine forests." },
          { title: "Sinja to Rara Lake via Chuchchemara", days: "5-6", detail: "Cross Chuchchemara ridge (3,800 m). Descend through Rara National Park to the lake shore (2,990 m). Crystal-clear water surrounded by cedar and pine." },
          { title: "Rara Lake exploration and return", days: "7-10", detail: "Circuit of the lake (3-4 hr walk). Visit Rara village and Thakuri settlements. Return to Jumla via the same route or northern trail." },
        ],
      },
      {
        name: "Mugu–Rara–Humla Traverse",
        days: "20-25",
        km: "200",
        estimated: true,
        highlight: "Remote far-west crossing through Mugu to Simikot — Nepal's least-visited trail",
        stages: [
          { title: "Jumla to Rara Lake", days: "1-4", detail: "Standard approach to Rara Lake from Jumla. Resupply for extended remote trekking." },
          { title: "Rara to Gamgadhi (Mugu)", days: "5-8", detail: "Head north from Rara into Mugu district. Pass through Pina and cross forested ridges to Gamgadhi (2,095 m), the remote district headquarters." },
          { title: "Gamgadhi to Mugu Karnali valley", days: "9-12", detail: "Follow the Mugu Karnali River through narrow gorges. Pass through Mangri and enter the upper valley. Tibetan-influenced villages appear." },
          { title: "Mugu to Humla via high passes", days: "13-18", detail: "Cross the Chankheli Pass (4,480 m) or Namja La linking Mugu to Humla district. Very remote — no settlements for 2-3 days. Requires full camping." },
          { title: "Descent to Simikot", days: "19-25", detail: "Enter the Humla valley system. Reach Simikot (2,985 m), the Humla district capital with an airstrip. Fly out to Nepalgunj." },
        ],
      },
      {
        name: "Simikot to Hilsa (Tibet Border) Trek",
        days: "7-10",
        km: "110",
        highlight: "Ancient trading route to Tibet — used by Hindu/Buddhist pilgrims to Mt Kailash",
        stages: [
          { title: "Fly to Simikot", days: "1", detail: "Fly Nepalgunj to Simikot (2,985 m). Weather delays common — build buffer days. Simikot is roadless and remote." },
          { title: "Simikot to Dharapuri", days: "2-3", detail: "Follow the Humla Karnali River through deep gorges. Pass Masra and Kermi (hot springs). Reach Dharapuri." },
          { title: "Dharapuri to Yalbang", days: "4-5", detail: "Continue upstream. Visit Yalbang Monastery, one of the most important gompas in western Nepal. Tibetan Buddhist culture dominates." },
          { title: "Yalbang to Tumkot to Hilsa", days: "6-8", detail: "Pass Thado Dunga and Tumkot. Arrive at Hilsa (3,628 m) on the Tibet/China border. View the Karnali gorge and the bridge to Purang (Tibet)." },
          { title: "Return to Simikot or cross to Tibet", days: "9-10", detail: "Return to Simikot for flights. Pilgrims with Chinese visas cross into Tibet for Mt Kailash and Lake Mansarovar." },
        ],
      },
      {
        name: "Limi Valley Trek",
        days: "14-18",
        km: "150",
        estimated: true,
        highlight: "Remote Tibetan valley — one of Nepal's last truly untouched regions",
        stages: [
          { title: "Simikot to Muchu", days: "1-3", detail: "Head north from Simikot through terraced fields and forests. Cross Nyalu Lagna (4,010 m) and descend to Muchu village." },
          { title: "Muchu to Til", days: "4-6", detail: "Enter the Limi Valley via a high route. Reach Til (4,000 m), one of three ancient Limi villages with whitewashed houses and fluttering prayer flags." },
          { title: "Til to Halji", days: "7-9", detail: "Trek to Halji (3,660 m), home to the 1,000-year-old Halji Monastery (Rinchenling Gompa). One of the oldest monasteries in the western Himalaya." },
          { title: "Halji exploration and return", days: "10-14", detail: "Explore the valley. Visit Jang (the third village). Cross-valley day hikes." },
          { title: "Return to Simikot via Nyalu La", days: "15-18", detail: "Retrace the route south. Fly from Simikot. Or continue to Hilsa to complete the Humla circuit." },
        ],
      },
    ],
  },
];

const logisticsData = [
  {
    icon: "📋",
    title: "Permits & Documentation",
    items: [
      "TIMS card required for most trekking regions (USD $20)",
      "Restricted area permits for Dolpo, Humla, Kanchenjunga, Manaslu, Upper Mustang (USD $500/10 days)",
      "National park entry fees vary: Sagarmatha $30, Annapurna $30, Langtang $30, Rara $30, Makalu-Barun $30",
      "Conservation area permits: Kanchenjunga $20, Gaurishankar $20, Manaslu $70–100",
      "Nepal tourist visa: 15/30/90 day options, extendable at Immigration Kathmandu",
      "Licensed trekking guide mandatory in all national parks since 2023",
    ],
  },
  {
    icon: "🗓",
    title: "Season Windows",
    items: [
      "Autumn (Oct–Nov): Prime season — stable weather, clear skies, post-monsoon freshness",
      "Spring (Mar–May): Rhododendron blooms, warmer but hazier, pre-monsoon buildup",
      "Winter (Dec–Feb): Cold but clear at lower elevations, high passes closed",
      "Monsoon (Jun–Sep): Mustang and Dolpo rain-shadow treks viable, leeches elsewhere",
    ],
  },
  {
    icon: "💰",
    title: "Budget Planning",
    items: [
      "Tea-house treks: USD $30–60/day (lodge, meals, permits)",
      "Camping treks (remote areas): USD $80–150/day (guide, porters, food, gear)",
      "Restricted area permits add USD $50–70/day to base costs",
      "Domestic flights (Lukla, Jomsom, Juphal, Simikot): USD $150–350 per sector",
      "Helicopter evacuation insurance essential — rescue costs USD $3,000–5,000+",
    ],
  },
  {
    icon: "🎒",
    title: "Essential Gear",
    items: [
      "4-season sleeping bag rated to -15°C for high passes",
      "Layered clothing system: base, insulation, hardshell, down jacket",
      "Trekking boots (broken in), gaiters for snow sections",
      "Crampons and ice axe for technical passes (Sherpani Col, Tashi Lapcha, Cho La)",
      "Water purification (SteriPEN, Aquamira, or LifeStraw), sun protection SPF 50+",
      "First aid kit with Diamox, rehydration salts, blister care",
    ],
  },
];

const safetyData = {
  difficultyTiers: [
    { level: "Easy", color: "#40956d", label: "Poon Hill, Ghorepani, Helambu", desc: "Well-marked trails, tea-house lodges, below 3,500 m. Suitable for fit beginners." },
    { level: "Moderate", color: "#3472a4", label: "EBC, ABC, Langtang, Manaslu Circuit", desc: "Sustained altitude 3,500–5,400 m. Requires acclimatization and good fitness." },
    { level: "Strenuous", color: "#d4832a", label: "Three Passes, Kanchenjunga, Upper Dolpo", desc: "Remote areas, high passes up to 5,500 m, camping sections, multi-week commitment." },
    { level: "Technical", color: "#9b3b52", label: "Sherpani Col, Tashi Lapcha, West Col", desc: "Mountaineering skills required. Fixed ropes, crampons, glacier travel above 6,000 m." },
  ],
  altitudeRules: [
    "Above 3,000 m: ascend no more than 500 m/day in sleeping altitude",
    "Every 3rd day: take an acclimatization rest day above 3,500 m",
    "Diamox (125–250 mg) prophylaxis: begin 1 day before ascent above 3,000 m",
    "AMS symptoms (headache, nausea, fatigue): do not ascend — descend if worsening",
    "HACE/HAPE: life-threatening — immediate descent and evacuation required",
    "Hydrate 3–4 liters/day at altitude, avoid alcohol and sleeping pills",
  ],
  emergencyInfo: [
    { label: "Helicopter rescue", value: "Available from Kathmandu, Lukla, Pokhara — weather dependent" },
    { label: "Insurance", value: "Mandatory travel insurance covering helicopter evacuation up to 6,500 m" },
    { label: "Communication", value: "Satellite phone or Garmin InReach for areas beyond mobile coverage" },
    { label: "TAAN rescue", value: "Trekking Agencies' Association of Nepal operates emergency coordination" },
    { label: "Hospital access", value: "CIWEC or Nepal International Clinic in Kathmandu for post-trek medical" },
  ],
};

const cultureData = {
  peoples: [
    { name: "Sherpa", region: "Khumbu, Rolwaling", note: "Buddhist mountaineering culture, monasteries, Mani Rimdu festival" },
    { name: "Rai & Limbu", region: "Eastern Nepal", note: "Kirant animist traditions, Mundhum oral literature, cardamom farmers" },
    { name: "Tamang", region: "Langtang, Helambu", note: "Tibeto-Burman language, stone-roofed villages, Tamang Selo music" },
    { name: "Gurung", region: "Annapurna, Manaslu", note: "Former Gurkha soldiers, Rodhi communal halls, honey hunters" },
    { name: "Thakali", region: "Kali Gandaki valley", note: "Historic salt traders, renowned cuisine, prosperous lodges" },
    { name: "Dolpo-pa", region: "Dolpo", note: "Ancient Bön Buddhist traditions, yak caravans, Crystal Mountain pilgrimage" },
    { name: "Magar", region: "Western hills", note: "Nepal's largest ethnic group in western regions, Barha Magarat kingdom heritage" },
    { name: "Loba", region: "Upper Mustang", note: "Tibetan kingdom of Lo, walled city of Lo Manthang, cave monasteries" },
  ],
  festivals: [
    { name: "Dashain", timing: "Oct", desc: "Nepal's largest festival — 15 days of family reunion, kite flying, and animal offerings" },
    { name: "Tihar", timing: "Oct–Nov", desc: "Festival of lights honoring Laxmi — oil lamps, marigolds, and Deusi-Bhailo singing" },
    { name: "Losar", timing: "Feb–Mar", desc: "Tibetan-Buddhist new year celebrated in Sherpa, Tamang, and Gurung communities" },
    { name: "Mani Rimdu", timing: "Oct–Nov", desc: "Sherpa monastery festival with masked dances at Tengboche, Thame, and Chiwong" },
    { name: "Tiji Festival", timing: "May", desc: "Three-day horse festival in Lo Manthang — monks perform masked demon-subduing dances" },
  ],
  etiquette: [
    "Always walk clockwise around stupas, mani walls, and prayer wheels",
    "Remove shoes before entering monasteries and homes",
    "Ask permission before photographing people, ceremonies, or religious sites",
    "Use right hand or both hands when giving or receiving — left hand is considered impure",
    "Dress modestly at religious sites — cover shoulders and knees",
    "Tipping guides and porters is customary — USD $15–20/day for guides, $10–12 for porters",
  ],
};

const environmentData = {
  conservationAreas: [
    { name: "Sagarmatha National Park", area: "1,148 km²", note: "UNESCO World Heritage Site — Everest, Lhotse, Cho Oyu" },
    { name: "Annapurna Conservation Area", area: "7,629 km²", note: "Nepal's largest protected area — ACAP managed by NTNC" },
    { name: "Langtang National Park", area: "1,710 km²", note: "Closest national park to Kathmandu — red panda habitat" },
    { name: "Makalu-Barun National Park", area: "1,500 km²", note: "No buffer zone — pristine eastern wilderness" },
    { name: "Kanchenjunga Conservation Area", area: "2,035 km²", note: "Community-managed — first conservation area in eastern Nepal" },
    { name: "Manaslu Conservation Area", area: "1,663 km²", note: "Restricted area — protects snow leopard and musk deer" },
    { name: "Shey-Phoksundo National Park", area: "3,555 km²", note: "Nepal's largest national park — Dolpo's turquoise lake" },
    { name: "Rara National Park", area: "106 km²", note: "Nepal's smallest national park — surrounds the country's largest lake" },
  ],
  wildlife: [
    { name: "Snow Leopard", status: "Vulnerable", range: "Dolpo, Manaslu, Kanchenjunga — approximately 300–400 in Nepal" },
    { name: "Red Panda", status: "Endangered", range: "Langtang, eastern Nepal temperate forests — bamboo dependent" },
    { name: "Himalayan Tahr", status: "Near Threatened", range: "Rocky slopes 3,000–5,000 m across all regions" },
    { name: "Musk Deer", status: "Endangered", range: "Dense forests 2,500–4,500 m — poaching pressure for musk gland" },
  ],
  principles: [
    "Pack out all waste — no burning trash at altitude",
    "Use established campsites and trails to prevent erosion",
    "Carry reusable water bottles — avoid single-use plastic in the mountains",
    "Support lodges using solar/micro-hydro power over diesel generators",
    "Hire local guides and porters — direct economic benefit to trail communities",
    "Respect wildlife buffer zones — maintain distance, never feed animals",
  ],
  climateImpact: "Nepal's glaciers have lost nearly a third of their ice since the 1990s. Shifting monsoon patterns affect trail seasons, glacial lakes pose GLOF risks, and high-altitude ecosystems face accelerating change. Responsible trekking minimizes footprint while supporting communities leading local conservation.",
};

function parseRangeToMid(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const cleaned = value.replace(/\s/g, "");
  if (!cleaned.includes("-")) {
    return Number(cleaned);
  }
  const [start, end] = cleaned.split("-").map(Number);
  return (start + end) / 2;
}

function HomePage() {
  const [activeChunkId, setActiveChunkId] = useState(trailChunks[0].id);
  const [navOpen, setNavOpen] = useState(false);

  const regionColors = [
    "#d4832a", "#2d8a8e", "#3472a4", "#7556a0",
    "#40956d", "#3558a1", "#d4613a", "#b2793a", "#9b3b52",
  ];

  useEffect(() => {
    document.body.classList.add("js-enhanced");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const revealItems = document.querySelectorAll(".reveal");
    revealItems.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index * 80, 400)}ms`;
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      document.body.classList.remove("js-enhanced");
    };
  }, []);

  const chunksWithMetrics = useMemo(() => trailChunks.map((chunk) => {
    const places = chunk.places.map((place) => {
      const daysValue = parseRangeToMid(place.days);
      const stages = (place.stages ?? []).map((stage) => ({
        ...stage,
        daysValue: parseRangeToMid(stage.days),
      }));
      return {
        ...place,
        daysValue,
        kmValue: parseRangeToMid(place.km),
        stages,
      };
    });
    const totalDays = places.reduce((sum, place) => sum + place.daysValue, 0);
    return {
      ...chunk,
      places,
      totalDays,
    };
  }), []);

  const allPlaceKm = useMemo(() => chunksWithMetrics.flatMap((chunk) =>
    chunk.places.map((place) => place.kmValue).filter((kmValue) => kmValue !== null)
  ), [chunksWithMetrics]);
  const kmBarScale = useMemo(() => scaleLinear()
    .domain([Math.min(...allPlaceKm), Math.max(...allPlaceKm)])
    .range([20, 100]), [allPlaceKm]);
  const activeChunk = chunksWithMetrics.find((chunk) => chunk.id === activeChunkId) ?? chunksWithMetrics[0];

  return (
    <div className="page-shell">
      <CartDrawer />
      <a className="skip-link" href="#top">Skip to main content</a>
      <header className={`site-header${navOpen ? " nav-is-open" : ""}`}>
        <div className="header-row">
          <a className="brand" href="#top" aria-label="Great Himalaya Trail Nepal">
            <span className="brand-mark"></span>
            <span className="brand-copy">
              <strong>Great Himalaya Trail</strong>
              <small>Nepal</small>
            </span>
          </a>
          <button
            className="nav-toggle"
            aria-label={navOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((p) => !p)}
          >
            <span className="nav-toggle-bar" />
          </button>
        </div>
        <nav
          className={`site-nav${navOpen ? " is-open" : ""}`}
          aria-label="Primary"
          onClick={() => setNavOpen(false)}
        >
          <a href="#story">Story</a>
          <a href="#regions">Regions</a>
          <a href="#chunks">Journeys</a>
          <a href="#experience">Experience</a>
          <a href="#plan">Plan</a>
          <a href="#logistics">Logistics</a>
          <a href="#safety">Safety</a>
          <a href="#culture">Culture</a>
          <a href="#environment">Environment</a>
          <a href="#booking">Contact</a>
          <Link to="/shop" className="nav-shop-link">Shop</Link>
        </nav>
        <CartIcon />
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy reveal">
            <p className="eyebrow">High routes. Deep valleys. Human scale wonder.</p>
            <h1>The roofline of Nepal, translated into a modern journey.</h1>
            <p className="hero-text">
              The Great Himalaya Trail threads through glacier basins, wind-cut passes, Sherpa
              villages, hidden monasteries, and forests that drop toward subtropical river gorges.
              This is not one trail. It is a continent of footsteps.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#plan">
                Start Planning
              </a>
              <a className="button button-secondary" href="#regions">
                See Regions
              </a>
            </div>
            <ul className="hero-stats" aria-label="Trail stats">
              <li>
                <strong>1,700 km</strong>
                <span>across Nepal's mountain spine</span>
              </li>
              <li>
                <strong>10+ regions</strong>
                <span>each with distinct terrain and culture</span>
              </li>
              <li>
                <strong>4 seasons</strong>
                <span>with spring and autumn at their most luminous</span>
              </li>
            </ul>
          </div>

          <div className="hero-visual reveal">
            <div className="summit-card glass-panel">
              <p className="card-label">Featured Traverse</p>
              <h2>Kanchenjunga to Humla</h2>
              <p>
                A long-form crossing from the far east to the Tibetan-edge west, stitched together
                by high passes, tea-house villages, and remote camping sections.
              </p>
              <div className="summit-grid">
                <div>
                  <span>Altitude mood</span>
                  <strong>Sea of ridgelines</strong>
                </div>
                <div>
                  <span>Best pace</span>
                  <strong>Slow expedition</strong>
                </div>
                <div>
                  <span>Character</span>
                  <strong>Wild and ceremonial</strong>
                </div>
                <div>
                  <span>Ideal season</span>
                  <strong>Oct to Nov</strong>
                </div>
              </div>
            </div>
            <div className="elevation-ring" aria-hidden="true">
              <span>Everest</span>
              <span>Annapurna</span>
              <span>Dolpo</span>
              <span>Humla</span>
            </div>
          </div>
        </section>

        <section className="story-section reveal" id="story">
          <div className="section-heading">
            <p className="eyebrow">Why it matters</p>
            <h2>A trail defined by contrast rather than distance alone.</h2>
          </div>
          <div className="story-grid">
            <article className="story-panel accent-panel">
              <p>
                Nepal's Great Himalaya Trail is compelling because every few days the visual grammar
                changes: icefields become yak pasture, juniper smoke gives way to rhododendron
                forest, and fortress villages open into broad Buddhist valleys.
              </p>
            </article>
            <article className="story-panel">
              <h3>Culture is the route</h3>
              <p>
                The trail is shaped by Tamang, Sherpa, Thakali, Gurung, Rai, and
                Tibetan-influenced communities whose architecture, food, and ritual mark each stage
                as distinctly as the mountains do.
              </p>
            </article>
            <article className="story-panel">
              <h3>Landscape at full scale</h3>
              <p>
                From Kanchenjunga to Darchula, the route reveals Nepal as a sequence of climatic
                worlds stacked vertically into one country.
              </p>
            </article>
          </div>
        </section>

        <div className="prayer-flags" aria-hidden="true"><span /><span /><span /><span /><span /></div>

        <section className="regions-section" id="regions">
          <div className="section-heading reveal">
            <p className="eyebrow">Regions</p>
            <h2>Four signatures of the trail.</h2>
          </div>
          <div className="regions-grid">
            <article className="region-card reveal">
              <span className="region-index">01</span>
              <h3>Eastern Frontier</h3>
              <p>
                Kanchenjunga and Makalu country, where giant walls rise above cardamom hills and
                village trails feel exploratory.
              </p>
            </article>
            <article className="region-card reveal">
              <span className="region-index">02</span>
              <h3>Khumbu Heights</h3>
              <p>
                Ice, monasteries, suspension bridges, and a skyline crowned by Everest, Lhotse, and
                Ama Dablam.
              </p>
            </article>
            <article className="region-card reveal">
              <span className="region-index">03</span>
              <h3>Central Classics</h3>
              <p>
                Langtang, Manaslu, and Annapurna bring dramatic access to high passes, deep
                villages, and iconic tea-house rhythm.
              </p>
            </article>
            <article className="region-card reveal">
              <span className="region-index">04</span>
              <h3>Western Wilds</h3>
              <p>
                Dolpo, Jumla, and Humla expand into quiet plateaus, turquoise lakes, and some of
                Nepal's most remote cultural landscapes.
              </p>
            </article>
          </div>
        </section>

        <section className="journey-section" id="chunks">
          <div className="section-heading reveal">
            <p className="eyebrow">East to West</p>
            <h2>Nine journeys across Nepal's mountain spine.</h2>
            <p>
              Use these sections as planning blocks. Start with the popular corridors, then stitch
              in remote segments when you want deeper expedition character.
            </p>
          </div>

          <div className="journey-map reveal">
            <div className="journey-map-bg" aria-hidden="true">
              <svg viewBox="0 0 1200 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="mtn-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(212,131,42,0.07)" />
                    <stop offset="50%" stopColor="rgba(64,149,109,0.07)" />
                    <stop offset="100%" stopColor="rgba(155,59,82,0.07)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,85 Q75,70 150,62 Q225,54 300,38 Q375,22 450,28 Q525,34 600,18 Q675,2 750,28 Q825,54 900,42 Q975,30 1050,52 Q1125,74 1200,78 L1200,100 L0,100 Z"
                  fill="url(#mtn-grad)"
                />
              </svg>
            </div>
            <div className="journey-track-container">
              <div className="journey-track-bg" />
              <div
                className="journey-track-fill"
                style={{ width: `${((parseInt(activeChunk.id, 10) - 1) / 8) * 100}%` }}
              />
              {chunksWithMetrics.map((chunk, i) => {
                const isActive = chunk.id === activeChunk.id;
                const color = regionColors[i];
                return (
                  <button
                    key={chunk.id}
                    className={`journey-node${isActive ? " is-active" : ""}`}
                    style={{ "--nc": color, left: `${(i / 8) * 100}%` }}
                    onClick={() => {
                      setActiveChunkId(chunk.id);
                    }}
                    aria-pressed={isActive}
                    aria-label={`${chunk.title} — ${chunk.band}`}
                  >
                    <span className="journey-node-pip" />
                    <span className="journey-node-num">{chunk.id}</span>
                    <span className="journey-node-title">{chunk.title}</span>
                  </button>
                );
              })}
            </div>
            <div className="journey-map-ends">
              <span>Kanchenjunga</span>
              <span>Humla</span>
            </div>
          </div>

          <div
            className="journey-detail"
            style={{
              "--accent": regionColors[parseInt(activeChunk.id, 10) - 1],
            }}
          >
            <div className="journey-detail-header">
              <span className="journey-badge">{activeChunk.id}</span>
              <div className="journey-detail-titles">
                <span className="journey-detail-band">{activeChunk.band}</span>
                <h3>{activeChunk.title}</h3>
              </div>
              <div className="journey-detail-pills">
                <span className="journey-pill">{activeChunk.style}</span>
                <span className="journey-pill">~{Math.round(activeChunk.totalDays)} days</span>
                <span className="journey-pill">{activeChunk.places.length} routes</span>
              </div>
            </div>

            {(activeChunk.elevation || activeChunk.season || activeChunk.permit) && (
              <div className="journey-meta-row">
                {activeChunk.elevation && (
                  <div className="journey-meta-item">
                    <span className="journey-meta-label">High point</span>
                    <span className="journey-meta-value">{activeChunk.elevation}</span>
                  </div>
                )}
                {activeChunk.season && (
                  <div className="journey-meta-item">
                    <span className="journey-meta-label">Best season</span>
                    <span className="journey-meta-value">{activeChunk.season}</span>
                  </div>
                )}
                {activeChunk.permit && (
                  <div className="journey-meta-item">
                    <span className="journey-meta-label">Permits</span>
                    <span className="journey-meta-value">{activeChunk.permit}</span>
                  </div>
                )}
              </div>
            )}

            <div className="journey-routes">
              {activeChunk.places.map((place, pi) => (
                <article className="journey-route is-open" key={place.name}>
                  <div className="journey-route-header">
                    <span className="journey-route-idx">{pi + 1}</span>
                    <div className="journey-route-info">
                      <strong>{place.name}</strong>
                      <span>
                        {place.days} days
                        {place.km ? ` · ${place.km} km` : ""}
                        {place.estimated ? " (est.)" : ""}
                      </span>
                    </div>
                    {place.km ? (
                      <span className="journey-bar" aria-hidden="true">
                        <span
                          className="journey-bar-fill"
                          style={{ width: `${Math.round(kmBarScale(place.kmValue))}%` }}
                        />
                      </span>
                    ) : null}
                  </div>

                  {place.highlight && (
                    <p className="journey-route-highlight">{place.highlight}</p>
                  )}

                  {place.stages.length > 0 && (
                    <div className="journey-stages">
                      {place.stages.map((stage, si) => (
                        <div className="journey-stage" key={`${stage.title}-${si}`}>
                          <div className="journey-stage-marker">
                            <span className="journey-stage-dot" />
                            {si < place.stages.length - 1 && (
                              <span className="journey-stage-connector" />
                            )}
                          </div>
                          <div className="journey-stage-body">
                            <div className="journey-stage-head">
                              <span className="journey-stage-num">Stage {si + 1}</span>
                              <span className="journey-stage-days">Days {stage.days}</span>
                            </div>
                            <strong>{stage.title}</strong>
                            <p>{stage.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="experience-section" id="experience">
          <div className="experience-copy reveal">
            <p className="eyebrow">Atmosphere</p>
            <h2>Built for travelers who want grandeur without flattening the place.</h2>
            <p>
              A meaningful Great Himalaya Trail journey balances physical ambition with time for
              acclimatization, village stays, local guides, weather patience, and the humility to
              let the mountains set the rhythm.
            </p>
          </div>
          <div className="experience-list">
            <article className="experience-item reveal">
              <h3>Tea-house rhythm</h3>
              <p>Warm kitchens, dal bhat refuels, and trail days anchored by local lodges.</p>
            </article>
            <article className="experience-item reveal">
              <h3>Remote camp sections</h3>
              <p>Western Nepal opens into longer, quieter stretches where logistics matter.</p>
            </article>
            <article className="experience-item reveal">
              <h3>Pass-crossing drama</h3>
              <p>Snow lines, moraine basins, prayer flags, and weather windows shape the route.</p>
            </article>
          </div>
        </section>

        <section className="plan-section reveal" id="plan">
          <div className="section-heading">
            <p className="eyebrow">Plan the crossing</p>
            <h2>Choose a route length that matches your appetite.</h2>
          </div>
          <div className="plan-grid">
            <article className="plan-card glass-panel">
              <span>Short immersion</span>
              <h3>12-18 days</h3>
              <p>Focus on one signature zone such as Everest, Manaslu, or Annapurna.</p>
            </article>
            <article className="plan-card glass-panel featured-plan">
              <span>Balanced expedition</span>
              <h3>4-6 weeks</h3>
              <p>Combine two to three regions with proper acclimatization and cultural depth.</p>
            </article>
            <article className="plan-card glass-panel">
              <span>Full traverse</span>
              <h3>3-5 months</h3>
              <p>Commit to a true east-west arc across Nepal's high country.</p>
            </article>
          </div>
        </section>

        <div className="prayer-flags" aria-hidden="true"><span /><span /><span /><span /><span /></div>

        <section className="logistics-section" id="logistics">
          <div className="section-heading reveal">
            <p className="eyebrow">Logistics &amp; Permits</p>
            <h2>What operators and trekkers need before the trail.</h2>
          </div>
          <div className="logistics-grid">
            {logisticsData.map((card) => (
              <article className="logistics-card glass-panel reveal" key={card.title}>
                <span className="logistics-icon" aria-hidden="true">{card.icon}</span>
                <h3>{card.title}</h3>
                <ul>
                  {card.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="safety-section" id="safety">
          <div className="section-heading reveal">
            <p className="eyebrow">Safety &amp; Difficulty</p>
            <h2>Know the terrain before you commit.</h2>
          </div>
          <div className="safety-tiers reveal">
            {safetyData.difficultyTiers.map((tier) => (
              <div className="safety-tier" key={tier.level} style={{ "--tier-color": tier.color }}>
                <div className="safety-tier-badge">
                  <span className="safety-tier-dot" />
                  <strong>{tier.level}</strong>
                </div>
                <div className="safety-tier-body">
                  <span className="safety-tier-routes">{tier.label}</span>
                  <p>{tier.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="safety-columns">
            <div className="safety-altitude reveal">
              <h3>Altitude Protocol</h3>
              <ul>
                {safetyData.altitudeRules.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </div>
            <div className="safety-emergency glass-panel reveal">
              <h3>Emergency &amp; Insurance</h3>
              {safetyData.emergencyInfo.map((info) => (
                <div className="safety-emergency-item" key={info.label}>
                  <span className="safety-emergency-label">{info.label}</span>
                  <span className="safety-emergency-value">{info.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="culture-section" id="culture">
          <div className="section-heading reveal">
            <p className="eyebrow">People &amp; Culture</p>
            <h2>The trail is shaped by the communities who live along it.</h2>
          </div>
          <div className="culture-peoples-grid">
            {cultureData.peoples.map((people) => (
              <article className="culture-people-card reveal" key={people.name}>
                <h3>{people.name}</h3>
                <span className="culture-people-region">{people.region}</span>
                <p>{people.note}</p>
              </article>
            ))}
          </div>
          <div className="culture-lower">
            <div className="culture-festivals reveal">
              <h3>Festivals Along the Trail</h3>
              <div className="culture-festivals-list">
                {cultureData.festivals.map((fest) => (
                  <div className="culture-festival-item" key={fest.name}>
                    <span className="culture-festival-timing">{fest.timing}</span>
                    <div>
                      <strong>{fest.name}</strong>
                      <p>{fest.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="culture-etiquette glass-panel reveal">
              <h3>Cultural Etiquette</h3>
              <ul>
                {cultureData.etiquette.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="prayer-flags" aria-hidden="true"><span /><span /><span /><span /><span /></div>

        <section className="environment-section" id="environment">
          <div className="section-heading reveal">
            <p className="eyebrow">Environment &amp; Conservation</p>
            <h2>Eight protected areas across Nepal's mountain spine.</h2>
          </div>
          <div className="env-parks-grid">
            {environmentData.conservationAreas.map((park) => (
              <div className="env-park-card reveal" key={park.name}>
                <strong>{park.name}</strong>
                <span className="env-park-area">{park.area}</span>
                <p>{park.note}</p>
              </div>
            ))}
          </div>
          <div className="env-lower">
            <div className="env-wildlife reveal">
              <h3>Key Wildlife</h3>
              <div className="env-wildlife-grid">
                {environmentData.wildlife.map((animal) => (
                  <div className="env-wildlife-card" key={animal.name}>
                    <strong>{animal.name}</strong>
                    <span className="env-wildlife-status">{animal.status}</span>
                    <p>{animal.range}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="env-principles glass-panel reveal">
              <h3>Leave No Trace — High Altitude</h3>
              <ul>
                {environmentData.principles.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="env-climate reveal">
            <p className="eyebrow">Climate Impact</p>
            <p>{environmentData.climateImpact}</p>
          </div>
        </section>

        <div className="mountain-divider" aria-hidden="true" />

        <section className="booking-section" id="booking">
          <div className="booking-inner reveal">
            <p className="eyebrow">For Operators &amp; Partners</p>
            <h2>Build GHT itineraries with local expertise.</h2>
            <p className="booking-desc">
              We work with licensed trekking agencies, international tour operators, and travel
              designers to build fully permitted, logistically sound Great Himalaya Trail packages
              — from single-region immersions to full east-west traverses.
            </p>
            <div className="booking-points">
              <div className="booking-point">
                <strong>Permit Handling</strong>
                <p>Restricted area permits, TIMS, national park entries — filed and confirmed before departure.</p>
              </div>
              <div className="booking-point">
                <strong>Custom Itineraries</strong>
                <p>Region combinations, difficulty calibration, acclimatization scheduling tailored to your group profile.</p>
              </div>
              <div className="booking-point">
                <strong>Local Operations</strong>
                <p>Licensed guides, porter teams, camping logistics, helicopter standby, and emergency coordination.</p>
              </div>
            </div>
            <a className="button button-primary" href="mailto:info@greathimalayatrail.com">
              Partner With Us
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <strong>Great Himalaya Trail</strong>
            <span>Nepal</span>
          </div>
          <nav className="footer-nav" aria-label="Footer">
            <a href="#story">Story</a>
            <a href="#regions">Regions</a>
            <a href="#chunks">Journeys</a>
            <a href="#logistics">Logistics</a>
            <a href="#safety">Safety</a>
            <a href="#culture">Culture</a>
            <a href="#environment">Environment</a>
            <a href="#booking">Contact</a>
          </nav>
          <p className="footer-copy">
            1,700 km across the roofline of Nepal — from Kanchenjunga to Humla.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
