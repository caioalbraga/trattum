
-- Allow medico to view all assessments
CREATE POLICY "Medicos can view all assessments"
ON public.avaliacoes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow medico to update assessments (approve/reject)
CREATE POLICY "Medicos can update assessments"
ON public.avaliacoes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow assistente to view all assessments
CREATE POLICY "Assistentes can view all assessments"
ON public.avaliacoes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'assistente'));

-- Allow assistente to update assessments
CREATE POLICY "Assistentes can update assessments"
ON public.avaliacoes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'assistente'));

-- Allow medico to view all profiles
CREATE POLICY "Medicos can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow assistente to view all profiles
CREATE POLICY "Assistentes can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'assistente'));

-- Allow medico to view all prescriptions
CREATE POLICY "Medicos can view all prescriptions"
ON public.prescricoes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow medico to manage prescriptions
CREATE POLICY "Medicos can manage prescriptions"
ON public.prescricoes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow assistente to view prescriptions
CREATE POLICY "Assistentes can view all prescriptions"
ON public.prescricoes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'assistente'));

-- Allow medico to view all documents
CREATE POLICY "Medicos can view all documents"
ON public.documentos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow medico to manage documents
CREATE POLICY "Medicos can manage documents"
ON public.documentos FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'medico'));

-- Allow medico to update documents
CREATE POLICY "Medicos can update documents"
ON public.documentos FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow assistente to view documents
CREATE POLICY "Assistentes can view all documents"
ON public.documentos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'assistente'));

-- Allow medico to view all notifications
CREATE POLICY "Medicos can manage all notifications"
ON public.notificacoes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow assistente to view notifications
CREATE POLICY "Assistentes can view all notifications"
ON public.notificacoes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'assistente'));

-- Allow assistente to manage notifications (for triage workflow)
CREATE POLICY "Assistentes can insert notifications"
ON public.notificacoes FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'assistente'));

-- Allow medico to view treatments
CREATE POLICY "Medicos can view all treatments"
ON public.tratamentos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow medico to update treatments
CREATE POLICY "Medicos can update treatments"
ON public.tratamentos FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow assistente to view treatments
CREATE POLICY "Assistentes can view all treatments"
ON public.tratamentos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'assistente'));

-- Allow medico to manage ajustes_clinicos
CREATE POLICY "Medicos can manage all adjustments"
ON public.ajustes_clinicos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow assistente to manage ajustes_clinicos
CREATE POLICY "Assistentes can manage all adjustments"
ON public.ajustes_clinicos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'assistente'));

-- Allow medico to manage notas_impedimento
CREATE POLICY "Medicos can manage impediment notes"
ON public.notas_impedimento FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow assistente to manage impediment notes
CREATE POLICY "Assistentes can manage impediment notes"
ON public.notas_impedimento FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'assistente'));

-- Allow medico to view pedidos
CREATE POLICY "Medicos can view all orders"
ON public.pedidos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow medico to update pedidos
CREATE POLICY "Medicos can update orders"
ON public.pedidos FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow medico to view audit_log
CREATE POLICY "Medicos can view audit logs"
ON public.audit_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Allow medico and assistente to insert audit logs
CREATE POLICY "Medicos can insert audit logs"
ON public.audit_log FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'medico'));

CREATE POLICY "Assistentes can insert audit logs"
ON public.audit_log FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'assistente'));

-- Allow medico to view enderecos
CREATE POLICY "Medicos can view addresses"
ON public.enderecos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'medico'));

-- Create a helper function to check if user has any admin-level role
CREATE OR REPLACE FUNCTION public.is_clinical_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'medico', 'assistente')
  )
$$;
