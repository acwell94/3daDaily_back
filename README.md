# 삼다일기 v1.0.0

### 목차
1. [서비스 소개](#-서비스-소개)
2. [사용 기술](#-사용-기술)
3. [DB 구성](#-db-구성)
4. [API 명세서](#-api-명세서)
5. [파일업로드](#-파일업로드)
6. [배포](#-배포)

## 📌 서비스 소개
<p align='center'>
<img width='200px' src='https://user-images.githubusercontent.com/89783182/222035863-cd30cc07-2690-47b6-8cc7-7a829d95fd33.png'/>
</p>
🗒️ 간단하게 오늘 하루를 기록하는 서비스 웹 버전 🗒️

사이트 : [https://www.3dadaily.store/](https://www.3dadaily.store/)
<br>

<br>
### [개발 배경](https://github.com/acwell94/3daDaily/wiki/%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EA%B0%9C%EC%9A%94)

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

## 📌 파일업로드

### AWS S3 이용

* 파일업로드를 위해서 AWS S3를 이용하였습니다.<br>
* aws-sdk, multer, multer-s3 라이브러리 사용하였습니다.<br>

## 📌 배포

