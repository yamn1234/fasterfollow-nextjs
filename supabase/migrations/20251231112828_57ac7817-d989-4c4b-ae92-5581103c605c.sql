-- Create tickets table
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_replies table
CREATE TABLE public.ticket_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;

-- Tickets policies for users
CREATE POLICY "Users can view their own tickets" 
ON public.tickets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" 
ON public.tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" 
ON public.tickets FOR UPDATE 
USING (auth.uid() = user_id);

-- Tickets policies for admins
CREATE POLICY "Admins can view all tickets" 
ON public.tickets FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all tickets" 
ON public.tickets FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Ticket replies policies for users
CREATE POLICY "Users can view replies on their tickets" 
ON public.ticket_replies FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tickets 
  WHERE tickets.id = ticket_replies.ticket_id 
  AND tickets.user_id = auth.uid()
));

CREATE POLICY "Users can create replies on their tickets" 
ON public.ticket_replies FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tickets 
  WHERE tickets.id = ticket_replies.ticket_id 
  AND tickets.user_id = auth.uid()
));

-- Ticket replies policies for admins
CREATE POLICY "Admins can view all replies" 
ON public.ticket_replies FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create replies" 
ON public.ticket_replies FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_replies;