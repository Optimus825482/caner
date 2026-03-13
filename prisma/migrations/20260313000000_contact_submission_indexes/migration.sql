-- Add indexes to speed up unread/read filtering and date sorting for contact submissions
CREATE INDEX "contact_submissions_isRead_idx" ON "contact_submissions"("isRead");
CREATE INDEX "contact_submissions_createdAt_idx" ON "contact_submissions"("createdAt");
