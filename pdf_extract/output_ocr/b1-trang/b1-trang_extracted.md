# Kết quả bóc tách PDF: b1-trang.pdf



<!-- START PAGE 1 -->

## [Trang 1]


# PHẦN 01

# Bức tranh AI

*AI, machine learning, LLM nằm ở đâu trong cùng một hệ?*


<!-- END PAGE 1 -->


<!-- START PAGE 2 -->

## [Trang 2]


# AI, ML, Deep Learning, GenAI, LLM — nằm ở đâu trong cùng một hệ?

từ rộng đến hẹp

![img-0.jpeg](img-0.jpeg)

- AI — chiếc ô lớn nhất: mọi hệ thống có yếu tố "thông minh".
- Machine learning — học từ dữ liệu thay vì viết luật tay.
- Deep learning — mạng nơ-ron nhiều tầng tự học đặc trưng.
- Generative AI — sinh nội dung mới: văn bản, ảnh, code.
- LLM — model nền chuyên ngôn ngữ, tìm của làn sóng hiện nay.

LLM không phải toàn bộ AI — nhưng nó là tầng nền của gần hết trải nghiệm AI bạn dùng hôm nay


<!-- END PAGE 2 -->


<!-- START PAGE 3 -->

## [Trang 3]


# Ba nhóm AI chính: phân loại · sinh nội dung · hành động

Discriminative AI

Giỏi **phân loại, dự đoán**: lọc spam, phát hiện gian lận, nhận diện ảnh.

*Input → một nhân, một con số*

Generative AI

**Sinh ra thứ mới**: văn bản, ảnh, code.
ChatGPT, Claude, Midjourney.

*Prompt → nội dung mới*

Agentic AI

Nhận **mục tiêu** rồi tự làm nhiều bước:
lập kế hoạch, dùng công cụ, hành động.

*Goal → Plan → Action*

LLM là **engine chung** của cả Generative lẫn Agentic — cuối buổi sáng mình sẽ thấy agent khác LLM ở đâu

Hành trình khóa học: LLM Foundation → Agent → Multi-Agent → Deploy → Evaluate


<!-- END PAGE 3 -->


<!-- START PAGE 4 -->

## [Trang 4]


PHẦN 02

# Lịch sử AI

*70 năm của những lần chạm trần và đổi nền tảng*


<!-- END PAGE 4 -->


<!-- START PAGE 5 -->

## [Trang 5]


# Lịch sử AI 70 năm

![img-1.jpeg](img-1.jpeg)

2 lần mùa đông, cách tiếp cận chậm trễ

Từ model đơn lẻ sang system có khả năng hành động như agent


<!-- END PAGE 5 -->


<!-- START PAGE 6 -->

## [Trang 6]


# 1956: Dartmouth Workshop

![img-2.jpeg](img-2.jpeg)


<!-- END PAGE 6 -->


<!-- START PAGE 7 -->

## [Trang 7]


# 1969: Perceptrons

![img-3.jpeg](img-3.jpeg)

Các hướng đi lần lượt **chạm trần**:

- **Hướng symbolic** (dạy máy bằng luật/quy tắc): bắt đầu đuổi trước thế giới quá nhiều ngữ cảnh
- **Hướng Perceptron** (thay vì viết hết luật, mình có thể cho máy học từ ví dụ) cũng gặp vấn đề vì quá đơn giản


<!-- END PAGE 7 -->


<!-- START PAGE 8 -->

## [Trang 8]


## 2009: Fei-Fei Li và ImageNet — cuộc cách mạng của dữ liệu

![img-4.jpeg](img-4.jpeg)


<!-- END PAGE 8 -->


<!-- START PAGE 9 -->

## [Trang 9]


# Deep Learning khác Machine Learning truyền thống ở chỗ nào?

## Machine Learning

![img-5.jpeg](img-5.jpeg)

## Deep Learning

![img-6.jpeg](img-6.jpeg)

Không cần con người thiết kế đặc trưng bằng tay — mạng sâu TỰ học đặc trưng từ dữ liệu thô, từ đơn giản đến phức tạp


<!-- END PAGE 9 -->


<!-- START PAGE 10 -->

## [Trang 10]


# Nút thắt của RNN: đọc hết rồi mới nói — từng bước một

![img-7.jpeg](img-7.jpeg)

## ① Câu càng dài → càng quên chữ đầu

Hôm qua tôi đi chợ
mua được một con cá to

chữ đầu "mở" dẫn trong vector duy nhất — như người cố nhớ một câu rất dài bằng trí nhớ ngắn hạn

## ② Từng bước một → chậm, khó mở rộng

1 → 2 → 3 → ... → 100

muốn chữ thứ 100 phải chờ đủ 99 bước trước — không song song được, khó scale lên model lớn

**Transformer thẳng không phải vì phép màu — nó tháo đúng nút thắt này: cho mọi từ nhìn nhau cùng lúc**

Sutskever et al. (2014), "Sequence to Sequence Learning with Neural Networks" — Wu et al. (2016), Google Neural Machine Translation — arxiv.org/abs/1609.08144


<!-- END PAGE 10 -->


<!-- START PAGE 11 -->

## [Trang 11]


![img-8.jpeg](img-8.jpeg)

ChatGPT xuất hiện,
chứng minh hiệu quả →
trong tâm của toàn ngành
bắt đầu dồn về cùng một
trục

Trước khi ChatGPT bùng nổ, nghiên cứu mô hình
ngôn ngữ phân thành rất nhiều nhánh


<!-- END PAGE 11 -->


<!-- START PAGE 12 -->

## [Trang 12]


# LLM là gì? — một bộ não nền, không phải một chatbot

**LLM (Large Language Model)** là một mô hình ngôn ngữ rất lớn, thường dựa trên kiến trúc Transformer, được luyện trên hàng nghìn tỷ mảnh chữ để học cách **đoán mảnh chữ tiếp theo trong ngữ cảnh**.

Nhờ được luyện đủ rộng, nó trở thành một **nền chung**: thay vì mỗi việc train một model riêng, cùng một model làm được rất nhiều việc.

Chatbot chỉ là **một dạng sản phẩm** đóng gói quanh bộ não đó — lớp áo bên ngoài.

![img-9.jpeg](img-9.jpeg)

LLM = bộ não ngôn ngữ dùng chung cho mọi việc — sản phẩm bạn thấy chỉ là lớp áo bên ngoài

Model hiện nay chủ yếu là kiến trúc decoder-only (GPT, Claude, Gemini, Kimi), nhiều model dùng MoE; sau pre-training còn các bước cần chỉnh (SFT, RLHF/DPO) và luyện suy luận (reasoning training, từ ~2025).


<!-- END PAGE 12 -->
