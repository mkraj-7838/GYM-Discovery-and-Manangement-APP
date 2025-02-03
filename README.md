# Gym Management and Discovery App

## Overview

The Gym Management and Discovery App is a comprehensive platform designed to streamline gym operations and improve user experience. It integrates gym discovery, management, and trainer recruitment, drawing inspiration from popular platforms like Zomato and Swiggy. The app caters to three primary user roles: Admin, Trainers, and Gym Members (Gymers), and offers a range of features to support gym management, user engagement, and gym discovery.

## Features

### Gym Discovery Module
* **Locate Nearby Gyms:**
  * GPS-based location and filters such as price, infrastructure, and equipment.
* **Gym Details:**
  * View gym photos, ratings, reviews, membership plans, and more.
* **Homepage Features:**
  * Updates on inter-gym competitions, announcements, fitness records, and nearby gyms.

### Gym Management Module
* **Admin Role:**
  * Manage members and trainers, update gym pricing, view activity logs, and post updates.
* **Trainer Role:**
  * Manage assigned users, track progress, and communicate via a chat section.
* **Gym Member Role (Gymers):**
  * Attendance system, personal dashboard, and communication with trainers.

### Additional Features
* **Complaint/Feedback Section:**
  * For users to raise complaints, provide feedback, or report issues.
* **Trainer Recruitment:**
  * A section for gyms to post job openings and for trainers to apply.

## Technical Requirements

* **Frontend:**
  * Mobile App: Kotlin with Jetpack Compose (Android).
  * Admin Dashboard: React.js or Next.js (Web).
* **Backend:**
  * Framework: Ktor (Kotlin) or Spring Boot.
  * Database: PostgreSQL or MongoDB.
  * Authentication: JWT (JSON Web Tokens).
  * Maps Integration: Google Maps API for location services.
* **Cloud Services:**
  * File Storage: AWS S3 or Firebase Storage.
  * Push Notifications: Firebase Cloud Messaging (FCM).

## Database Schema

* **Users Table:**
  * `user_id` (Primary Key)
  * `name`
  * `email` (unique)
  * `password`
  * `role` (admin, trainer, member)
  * `phone_number`
  * `address`
  * `registration_date`
  * `status` (trial, active, inactive)
* **Gyms Table:**
  * `gym_id` (Primary Key)
  * `name`
  * `address`
  * `latitude`, `longitude`
  * `price_range`
  * `infrastructure` (JSON: {machines, facilities})
  * `rating` (average rating)
  * `owner_contact`
* **Memberships Table:**
  * `membership_id` (Primary Key)
  * `user_id` (Foreign Key)
  * `gym_id` (Foreign Key)
  * `start_date`
  * `end_date`
  * `status` (active, expired)
  * `price`
* **Attendance Table:**
  * `attendance_id` (Primary Key)
  * `user_id` (Foreign Key)
  * `date`
  * `status` (present, absent)
* **Chats Table:**
  * `chat_id` (Primary Key)
  * `sender_id` (Foreign Key)
  * `receiver_id` (Foreign Key)
  * `message`
  * `timestamp`
* **Notices Table:**
  * `notice_id` (Primary Key)
  * `admin_id` (Foreign Key)
  * `title`
  * `description`
  * `date_posted`
* **Feedback/Complaints Table:**
  * `feedback_id` (Primary Key)
  * `user_id` (Foreign Key)
  * `description`
  * `type` (complaint, suggestion, feedback)
  * `status` (open, resolved)
  * `timestamp`
* **Recruitment Table:**
  * `job_id` (Primary Key)
  * `gym_id` (Foreign Key)
  * `title`
  * `description`
  * `salary_range`
  * `requirements`
  * `status` (open, closed)

## API Endpoints

* **User APIs:**
  * `POST /login`: Authenticate users and return tokens.
  * `POST /register`: Register new users.
  * `GET /gyms?location=lat,lng&filters=...`: Fetch nearby gyms.
  * `GET /gyms/{gym_id}`: Fetch details of a specific gym.
  * `POST /attendance`: Mark attendance.
  * `POST /feedback`: Submit feedback or complaints.
* **Admin APIs:**
  * `GET /users`: Fetch all users.
  * `POST /users`: Add new members or trainers.
  * `PUT /users/{user_id}`: Update user details.
  * `DELETE /users/{user_id}`: Remove a user.
  * `POST /notices`: Post updates.
## UI Wireframes

* **Homepage:**
  * Carousel for updates, nearby gyms, search bar.
* **Gym Details:**
  * Photo gallery, ratings, plans, equipment, and directions.

## Conclusion

The Gym Management and Discovery App provides a user-friendly, feature-rich experience for users, gym owners, and trainers. It integrates essential functionalities in one platform, enhancing the gym experience while streamlining operations for gym management and recruitment.
