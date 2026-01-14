-- Migration: Add createdBy field to Credit table
-- Run this SQL manually in your database:

ALTER TABLE "Credit" ADD COLUMN "createdBy" TEXT;
