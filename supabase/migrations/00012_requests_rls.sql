-- Row-level security for the requests marketplace tables.
-- These were accidentally omitted from 00006_requests_and_balance.sql.

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Companies manage their own requests (CRUD).
CREATE POLICY "company manages own requests"
  ON requests FOR ALL
  USING  (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- Creators (and anyone) can browse open requests.
CREATE POLICY "public reads open requests"
  ON requests FOR SELECT
  USING (status = 'open');

ALTER TABLE request_applications ENABLE ROW LEVEL SECURITY;

-- Creators manage their own applications.
CREATE POLICY "creator manages own applications"
  ON request_applications FOR ALL
  USING  (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Companies can read applications submitted to their requests.
CREATE POLICY "company reads applications for own requests"
  ON request_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_id AND r.company_id = auth.uid()
    )
  );

-- Companies can approve / reject (UPDATE) applications for their requests.
CREATE POLICY "company updates applications for own requests"
  ON request_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_id AND r.company_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_id AND r.company_id = auth.uid()
    )
  );
