import { Product, Review } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'green-detox',
    name: 'Green Detox Glow',
    description: 'Recharge your body with nature\'s finest greens. This revitalizing blend combines nutrient-dense kale and spinach with the refreshing zest of lemon and apple.',
    price: 249.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-rTwPH0-w94tHyhaV0VfiQq3rRRJWJqaj-AqwIVjG2_UJ2gmzVxDNeVp5OVWfyEaMqIb9wr4UMoOrY4mRcm3PgW-MPyZq7xg0XmB9E8kMFdIXyAPEo8j2kGHCB1f29IL_rOvT0BVMgkn3DiHQRaD6wKmkpUyiGOZdqaDxWbh7d5Uyrg45Gd-8HLkjR_1t8vysZGJCG76uoQsvaGtiDEA0TEYuUHwkWPzVwFl9ZG54-nGNO5Rlx26pv279gWVFyFEbtMeIxc8DIPf6',
    category: 'juice',
    ingredients: ['Kale', 'Spinach', 'Apple', 'Lemon', 'Cucumber'],
    benefits: ['Detox', 'Energy', 'Immunity'],
    rating: 4.9,
    reviews: 128,
    isBestSeller: true
  },
  {
    id: 'sunset-citrus',
    name: 'Sunset Citrus',
    description: 'A radiant blend to brighten your day. Pure valencia orange meets the delicate spice of turmeric and ginger, finished with a hint of carrot.',
    price: 299.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgv8Z6iJhI-X7Fa9M6_bsIymJxan77b7xE4ZpzVgifkcnldvTsWrDp-59_BOZ8b3eQqk3MhiQMjU0am0M9d0FF5ViAtP0Gt5uLdAAafu7KMRBISIxIPvJ3GL7-NPbvHTLkTj5clUPS3k_LJTmXDX_1mVRQ_jklK-g4rbcVOgEi7X1AJ6owa5EcbBF0n_aBLk8FMWVXgDGWxlIMApem5fkbRPI5CVf6O3a_D3PWOi0hAV9VE9AqCp7ZGa1nsCxgfZf29uAXemj0mdtC',
    category: 'juice',
    ingredients: ['Orange', 'Carrot', 'Turmeric', 'Ginger'],
    benefits: ['Immunity', 'Anti-inflammatory', 'Skin Health'],
    rating: 4.8,
    reviews: 142
  },
  {
    id: 'berry-blast',
    name: 'Berry Blast',
    description: 'A sweet and tart explosion of antioxidants. Acai, blueberries, and chia seeds blended with almond milk.',
    price: 349.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxHQ1aUIfRvs1ME6gXVU_mi_TmnPs7mfitcXdght97_UYfNNMAZPOcvoed0yqw4uuBMTZURPsNv9uhW1BJa0xYEmtFWyeK9eGIBhAwAM4I9erbBeEca3zgp7ac1aa9-yEdfYn_ig3YT4tV12WmBd3_P5JOkHrpVD-GXU0Be3x-6XZ1dlcKU-yowt0JFiBJpk3iQlMR-uD8Fb1y3HvjhLrPeNF_uuOIVkIAEHdz8II3VaYpV72NsKeXtJ-xmPnq5R-gZJZyTMTh_pc6',
    category: 'smoothie',
    ingredients: ['Acai', 'Blueberry', 'Chia', 'Almond Milk'],
    benefits: ['Antioxidant', 'Heart Health'],
    rating: 4.7,
    reviews: 89,
    isNew: true
  },
  {
    id: 'golden-glow',
    name: 'Golden Glow',
    description: 'Tropical paradise in a bottle. Pineapple, mint, and ginger combine for a refreshing digestive aid.',
    price: 249.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUibNVfdmDaErVMSu8H_Cj3uHtV6PX_bCAjAFEdrQfjEkN2kb3rX8Hm2yBStIsws1sPmM_-lKoMU0B6g2s9PeKxPubCFrCsECR_9XZLiGhSCvX1z_f947xMWalINGd3J3u6SBG-x-Yf_d7aTbj89e6zkcPV8vc1jiieJk5EYMlh8joM0I-jOV88GTKwyrRjW4s-ecs_w5SDVvDfjJiZCvcOR7rcMu5ZIXpBNJKsn0CfK0VDLcSrmkzI3us98ogYcamfROO_hHlfLY1',
    category: 'juice',
    ingredients: ['Pineapple', 'Mint', 'Ginger'],
    benefits: ['Digestion', 'Energy'],
    rating: 4.6,
    reviews: 56
  },
  {
    id: 'red-vitality',
    name: 'Red Vitality',
    description: 'Hydrating watermelon with a kick of lime and basil. Perfect for post-workout recovery.',
    price: 249.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcCjmbEnC8Hm0VVOFlcJuP84-Q5-iW5W4qYOw_FC9eYYw2rBwrYOXCqhN4zV-s3hsOQ4siHTekmL8xFeJK9uo0FnjTs4aR-dsYB7kE-u-eSCVxVt4AQnw-OI9U43T8HfgvHhhZb3fIg2NObgLiHubG0dH6lu0fH0iNmf163EGy23Ho3Jw5FPfwR4XRiAQVm7jLiojImDmqVVtFv1Lq9msYVKSGo221XDSDdLhK1f1Xl3mIlpue9QYgY4bDh6Swwout2dqwpyKBB_nk',
    category: 'juice',
    ingredients: ['Watermelon', 'Lime', 'Basil'],
    benefits: ['Hydration', 'Recovery'],
    rating: 4.8,
    reviews: 74
  },
  {
    id: 'celery-cleanse',
    name: 'Celery Cleanse',
    description: 'Pure organic celery juice with a splash of lemon. Simple, effective, and deeply hydrating.',
    price: 199.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUljGmqsvIrnrqEyYqA64saJ6MgIuO1YFrTb_tcq--QGka87UdKT0v8l3-jk4YorAijaNDP0DH2b0VwWVtO5qct9h306iL6dS_jF1TefH3H4SLa2JBrBPFXAdj-6_ACb8ozPFjypQOVgSBEkz25GkO40PJzVccReaz4w834lffaTfmx8f6S04wAXxBedLCY35AObGGA2AUbIbs0xp0jdV76KtBg59D6fijUkg3q7zS30fqwFy7wKYe8X5RAJ1_RjfPOA8FdWkZzK9c',
    category: 'juice',
    ingredients: ['Celery', 'Lemon'],
    benefits: ['Detox', 'Skin Health'],
    rating: 4.5,
    reviews: 42
  },
  {
    id: 'turmeric-shot',
    name: 'Turmeric Immunity Shot',
    description: 'A concentrated dose of anti-inflammatory power. Turmeric, black pepper, and orange.',
    price: 119.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmycbqtfHgkMIl7QyU81stNIERh0_e4RhtAvaUnUQ7D64dFckFZJWvJO27S7l7Nv6S2Z0vG7hAYDgiUiAWNA7BFnHjCnF_ZHbKyHXjHuJMdl4iPMYKuJ5RyDoygSXP-Nt1Y1OFJVR3my7nQ0V3ku7T0upkL7OVUvgSG7p2FK7TMpjgnXGph8q-kT45Z_NxHrIDb_QmkA7EabiXKRSP_3PQ0fLwB2JiviUmBCJPc0N-o2re8Op9Nd9HLHIGjxVte0pJ0F23RBo0yIr0',
    category: 'shot',
    rating: 4.9,
    reviews: 210
  },
  {
    id: 'ginger-fire',
    name: 'Ginger Fire Shot',
    description: 'Pure ginger, cayenne, and lemon. A fiery wake-up call for your system.',
    price: 119.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcc66-oqfEGT3_Lgc-KbE7XHDMVjFm02sW6cwUM8wWRGewca4BmLFDgy3WIh1XTDIyCCDK2lKFR0wCFik9odc5NHN9Qmz-amJxvBYNn2jlX5YRTlvKKkgolpwzX7Lk5rTNquJ4nBQbYFZmCuh3VbkFdwMuqze5XFhDLsGEpRgsmQw5gfDNd1tXEO6ruHvf2BGc-yM7JSd6dGarzGPOywdPWQ9GLC-yC3GK4pICifvnwPEzJvdNg2KDXJq-shKzhqP68K-d9F8of3m7',
    category: 'shot',
    rating: 4.8,
    reviews: 180
  },
  {
    id: 'mango-chips',
    name: 'Spicy Mango Chips',
    description: 'Dehydrated mango slices dusted with chili and lime zest. Sweet and spicy perfection.',
    price: 149.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWbxlh9ZnCxG6XFu62GkiAVs37F_Yf1F5zwtE7LwN_Wze4CHEmvfDveXsy2Egy02lMz-v4rYPgu3DeJUlGK4gzyObLAAjzwELxxccIL0vkB6nezDPC_cWLkZ0m3sa2V2G1Tg0vIre-vMisD2y3qzlH--PVmJaeaJBPv359Y_u_1HwxA8O_u_x6_8JQ1NAyWA2p5IdZxW196ZMfVoNFeaNLWdUS3OlU_vu5pYNlFalpeB21d98e7JDnAg3Q6P94xCPo88uGlbY5nl7F',
    category: 'snack',
    rating: 4.7,
    reviews: 92
  },
  {
    id: 'energy-mix',
    name: 'Energy Nut Mix',
    description: 'Raw almonds, cashews, walnuts, and cranberries. The perfect midday pick-me-up.',
    price: 199.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEYpDgpJFZFypKCzpr7asnVQjrnuhE9XP3Ke1UclKKphc9iSXa09ByPyV1185JixD1tv0Oenauv4K1GrUSZeAnycDMpXEO-bzKDiME014WEmLOM1qlNxmIh7M749M-Gb4qD-ElR43lhwhqI9GHFKP_y_l5WYe6K8HHtA1YxQE7CF17iRyntk4PS2tnRUj9Hn56ybvHvtNO-iOrbSJsRoIc5oTndTyhy_p0W8k1w6h-wcozvbkinzHWXb8Q772ObbdfEqn-1ukO_WxV',
    category: 'snack',
    rating: 4.6,
    reviews: 45
  },
  {
    id: 'acai-bowl',
    name: 'Acai Berry Bowl',
    description: 'Organic acai topped with fresh berries, banana, and hemp granola.',
    price: 399.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQUPltMcxLuxnYvPS4O7a-5RyggwF7FQ7HZQbOhWnUBHI-E72biCzisyzEvc-gTcaxNQsEyitwPBB0KRTbm4qh5dCnI7qpsLNN3Ir4PXfGhWfOOpoadlZg8YEo2OxKveIug5zUOrcqUc8qFn6UTymL7YK_NpTqRgZt0fh3IMVxTVMoeArJYXLzV6D_EcaoEtip4dzYCeCvJKL3ursAyXQGiJOW96x0fEc0wYwv83NsuTsXtGokLcbfgbX2TP_1U4WWlIuM929emRvr',
    category: 'smoothie',
    rating: 4.9,
    reviews: 310,
    isBestSeller: true
  },
   {
    id: 'farm-box',
    name: 'Farm Fresh Box',
    description: 'A seasonal selection of raw organic fruits and vegetables delivered straight from our partner farms.',
    price: 1499.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCro9nEFrfINjSsC93Q-zCMu-JMdh82ZMggyHRKE5e75ap5DUQ3wQuWQFSxqLVQ6D433TtSIYb9ruHtzBMsiiONIeNh3NFuZ92Ev7NEkLql52GyaP351AGZUl5AvQXQ2IrZYxG7KOTlH9cnbteL8ZQKiRez4fyoQRz-wg-LCNI1EzY-xXF8jLmrrjgP0U24YaZT9i8xOGYUsOIobkJJfNLSLf438jdtaMO0ncGJnxG8xyWLkESP9uep0hwTqWLBc3SwRBK6fgQioUWo',
    category: 'bundle',
    rating: 4.9,
    reviews: 15
  }
];

export const REVIEWS: Review[] = [
  {
    id: '1',
    author: 'Sarah Jenkins',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAorCBL7IqzCcQi46pjZtxQ41zbqg8SnOHLqGgICf-iHfp8cATa0xHBXlYym5iYFhDsAz_HNdImxCVppxkWSyliJdXvW3U4xK4ABtwScAUHuZYjRhoiADAHmhT3LbyR212TEZdoNCiwkJtfettup5nA5iumyjSFTMdzNIBJp0mR9sF62WQywodoEvd1FeEPbHW-kPmWRBJHqm52sXr96c49AI4loGLKgFwGC0UIMFL1Y8_aTCYjBJzzgztATFWStu4ci7O8-PyW0ilO',
    rating: 5,
    date: '2 days ago',
    title: 'Refreshing and not too sweet!',
    content: "I've tried so many green juices that taste like grass, but this one is actually delicious. The apple and lemon really balance out the kale. Definitely my new morning staple."
  },
  {
    id: '2',
    author: 'Michael Chen',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsBwYF7aqO3MxKaOJ4O-MEafZeakUSbS3qO04XZbbFufTRsLYLkQHRR_5pHaEenSt6IzeWLg6huLH4yUGCeRIYEPBo4hs68GSlHQGqyLAhapEHxyf_e3zV9xX3ps78Ok4y5aczbcueKdWI9orcKlgsnHtkBEyTovtGlU93ESOIqfCxOJfSP2ZteHdiWmpjjSm-JGAvSSiK8gf12HeiYBZq9hfURp7FU2AzSegWPr6h4J42StPgDMIND_d9lL_H9By89I1_2-9m_fpF',
    rating: 5,
    date: '1 week ago',
    title: 'Great energy boost',
    content: "I swapped my afternoon coffee for this and I feel so much better. No jitters, just clean energy. Shipping was super fast too!"
  }
];
