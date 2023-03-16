# 삼다일기 v1.0.0

### 개발기간

* #### [v1.0.0](https://github.com/acwell94/3daDaily_back/wiki) <span>2023.01.12 ~ 2023.02.22</span>
* #### [v1.0.1](https://github.com/acwell94/3daDaily_back/wiki/v1.0.1) <span>2023.03.15 </span>

##

### 목차
1. [서비스 소개](#-서비스-소개)
2. [사용 기술](#-사용-기술)
3. [DB 구성](#-db-구성)
4. [API 명세서](#-api-명세서)
5. [환경변수](#-환경변수)
6. [파일업로드](#-파일업로드)
7. [배포](#-배포)
8. [History](#-history)

## 📌 서비스 소개
<p align='center'>
<img width='200px' src='https://user-images.githubusercontent.com/89783182/222035863-cd30cc07-2690-47b6-8cc7-7a829d95fd33.png'/>
</p>
🗒️ 간단하게 오늘 하루를 기록하는 서비스 🗒️<br>
<br>

사이트 : [https://www.3dadaily.store/](https://www.3dadaily.store/)

### [개발 배경](https://github.com/acwell94/3daDaily_back/wiki)

## 📌 사용 기술
<p align='start'>
  <img src='https://img.shields.io/badge/Node.js-v16.17.0-339933?logo=Node.js'/>
  <img src="https://img.shields.io/badge/express-v4.18.2-47A248?logo=express">
  <img src="https://img.shields.io/badge/mongoose-v6.8.3-black?logo=mongoose">
  <img src="https://img.shields.io/badge/JWT-v9.0.0-black?logo=JSON Web Tokens">
  <img src="https://img.shields.io/badge/AWS-v2.1313.0-FF9900?logo=Amazon S3">
</p>

## 📌 DB 구성

<p align='center'>
  <img src='https://user-images.githubusercontent.com/89783182/222147447-4099d9e7-bf07-4870-a8b6-f8ae3e767d85.png'/>
</p>

## 📌 API 명세서

### User API
<p align='center'>
<img  src="https://user-images.githubusercontent.com/89783182/222172542-1672439a-e14e-4cf3-b346-a7c6c173f20a.png">
</p>

### Contents API
<p align='center'>
<img src="https://user-images.githubusercontent.com/89783182/222178120-b744ccf0-d284-4dd4-b944-052c172405c3.png">
</p>

## 📌 환경변수

|제목|내용|설명|
|------|---|---|
|JWT_KEY|JWT발급 키|JWT AccessToken 발급 키 네임|
|REFRESH_KEY|JWT발급 키|JWT RefreshToken 발급 키 네임|
|MONGO_USER|몽고디비 유저아이디|몽고디비 회원 아이디|
|MONGO_NAME|몽고디비 데이터베이스 이름|몽고디비 데이터베이스 이름|
|MONGO_PW|몽고디비 비밀번호|몽고디비 데이터베이스 접근 비밀번호|
|PORT|서버포트|서버포트번호|
|GOOGLE_API_KEY|구글 API 접근키|구글 API 접근 키|
|AWS_API_KEY|AWS접근키|AWS접근 키|
|AWS_API_SECRET_KEY|AWS접근 키|AWS접근 시크릿키|
|AWS_REGION|AWS 지역|AWS 지역명|


## 📌 파일업로드

### AWS S3 이용

* 파일업로드를 위해서 AWS S3를 이용하였습니다.<br>
* aws-sdk, multer, multer-s3 라이브러리 사용하였습니다.<br>

## 📌 배포

* [클라우드 타입](https://app.cloudtype.io/)을 이용하여 배포하였습니다.
* 무료로 배포할 수 있는 장점과 한국어로 된 클라우딩 플랫폼이기에 선택했습니다.

## 📌 History

#### [v1.0.0](https://github.com/acwell94/3daDaily_back/wiki) <span>2023.02.22 배포</span>
#### [v1.0.1](https://github.com/acwell94/3daDaily_back/wiki/v1.0.1) <span>2023.03.15 </span>
