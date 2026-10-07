# MERN Admin — AdminLTE 4 + Dynamic RBAC

A production-oriented MERN Admin Panel built with **MongoDB, Express.js, React, Node.js, AdminLTE 4 and Bootstrap 5**, with dynamic Role-Based Access Control (RBAC), multi-role users, permission overrides, audit logging, notifications, security controls and administrative settings.

---

## Table of Contents

- [Overview](#overview)
- [Core Architecture](#core-architecture)
- [Access-Control Model](#access-control-model)
- [Authentication & Account Management](#authentication--account-management)
- [User Management](#user-management)
- [User Status Management](#user-status-management)
- [Bulk User Actions](#bulk-user-actions)
- [User Export](#user-export)
- [User Activity](#user-activity)
- [Role Management](#role-management)
- [Permission Management](#permission-management)
- [Role Permission Assignment](#role-permission-assignment)
- [User Permission Overrides](#user-permission-overrides)
- [Dynamic RBAC](#dynamic-rbac)
- [Backend Route Protection](#backend-route-protection)
- [Admin Dashboard](#admin-dashboard)
- [Audit Logs](#audit-logs)
- [Audit Log Filters](#audit-log-filters)
- [Audit Log Export](#audit-log-export)
- [Notifications](#notifications)
- [Profile Management](#profile-management)
- [Profile Avatar](#profile-avatar)
- [Application Settings](#application-settings)
- [Security](#security)
- [Authentication Version & Session Invalidation](#authentication-version--session-invalidation)
- [Administrator Protection](#administrator-protection)
- [Frontend Authorization](#frontend-authorization)
- [Admin Layout](#admin-layout)
- [Reusable UI](#reusable-ui)
- [Search & Pagination](#search--pagination)
- [Lazy Loading](#lazy-loading)
- [Forbidden / Unauthorized Access](#forbidden--unauthorized-access)
- [Database Migrations](#database-migrations)
- [Database Seeder](#database-seeder)
- [Sample Data](#sample-data)
- [Default Permission Catalog](#default-permission-catalog)
- [Default Roles](#default-roles)
- [API Architecture](#api-architecture)
- [Validation](#validation)
- [Error Handling](#error-handling)
- [Environment Configuration](#environment-configuration)
- [Installation](#installation)
- [Development Workflow](#development-workflow)
- [Admin Modules](#admin-modules)
- [User-Facing Account Modules](#user-facing-account-modules)
- [Feature Summary](#feature-summary)
- [Current RBAC Permission Examples](#current-rbac-permission-examples)
- [Important Security Principle](#important-security-principle)
- [Future / Remaining Feature](#future--remaining-feature)
- [Project Goal](#project-goal)

---

# Overview

This project is a full-stack **MERN Admin Panel** with **AdminLTE 4**, **Bootstrap 5**, and a dynamic **Role-Based Access Control (RBAC)** system.

The application separates:

- User Management
- Role Management
- Permission Management
- Role Permission Assignment
- User Permission Overrides
- Audit Logs
- Notifications
- Application Settings
- Profile Management
- Authentication

The RBAC system is database-driven. Roles and permissions are stored in MongoDB and resolved dynamically when API requests are processed.

This means permission changes can take effect without hardcoding role names inside controllers.

---

# Core Architecture

The application follows a layered architecture:

```text
Frontend
    ↓
API
    ↓
Authentication
    ↓
Authorization / Permission Middleware
    ↓
Validation
    ↓
Controller
    ↓
Service
    ↓
Model
    ↓
MongoDB
