// Copied word for word from the original guide. Keep them that way: people paste these as-is.

export const MAIN = `i want to add a new kind of AI model called Jev to this workspace. Jev doesn't write anything. you hand it some text plus a few questions, and it answers them almost instantly, for almost nothing. it's made for sorting and deciding.
- Jev is brand new, so you won't know it yet. before anything else, read how it works: https://docs.typesafe.ai/llms.txt
- i'll use it through OpenRouter, where it's called typesafe/jev-1.13. how to call it there: https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-questions-and-answers-request. it's a brand new route, so follow those docs if anything has moved
- ask me for my OpenRouter key (i get one at https://openrouter.ai/keys). keep it somewhere safe on my computer, never inside a file i might share, and never show it back to me
- Jev can only answer in 3 shapes: pick one option from a list, give a score on a scale, or say how likely something is true. most answers also come back with how sure it is
- do one real test so i can watch it work. make up a short sales email and ask Jev 3 things: how strong a lead is this, what kind of email is it, and does it need a personal reply. show me its answers, how long it took and what it cost. if the test fails, show me the exact error
- then save what you learned as a reusable skill (or whatever your setup calls a saved instruction), so next time i can say "use Jev to sort these" about any pile of text
the rule from here on: Jev decides, you write. when Jev isn't sure about something, you make the call yourself. anything you send to Jev leaves my computer, so ask me before sending anything private.`;

export const ROUTER = `build me a model router that uses Jev. the idea: Jev sizes up every message i send, and small jobs go to a smaller, cheaper AI model instead of the biggest one. Jev is already set up in this workspace.
- for each message, ask Jev one question: what's the smallest model that can do this job well? give it 4 sizes to pick from: tiny (a lookup, a rename, a one-line answer), everyday (a normal email, post or short document), large (a multi-step build, research, a full report) and hardest (strategy, or anything where a wrong call is expensive)
- match each size to a model i actually have, smallest to biggest, and make one helper agent per size that runs on that model. if i have fewer models than sizes, use fewer sizes. each helper ends its reply with one line saying which model did the work
- when Jev is sure, hand the job to the matching helper and pass the result back to me. when Jev is less than 60% sure, or my message is a short reply that only makes sense inside our conversation, handle it yourself
- it must never slow me down or block a message. if Jev is slow, or anything at all goes wrong, carry on as if the router wasn't there
- give me a simple on and off switch, plus a status check that shows how many messages went to each size and what Jev has cost so far. keep it OFF until i turn it on
- be honest with me: if your setup can't switch models per message, say so, and build the closest thing that works
- test it for real with 8 sample messages, from tiny to hardest, plus 2 short replies like "yes do that but make it shorter". show me a table of what Jev picked and how sure it was
leave it OFF when you're done and tell me the exact words to turn it on. remind me that while it's on, my messages pass through OpenRouter to the company that makes Jev, so it stays off for private work.`;

export const INBOX = `use Jev to sort my inbox by lead quality. the emails are in [my export file or folder]. ask Jev 3 things about every email:
- how strong a lead is this? 4 levels: not a lead at all (spam, vendors, newsletters, job seekers, support, existing clients), cold (vague interest, tiny budget, poor fit), warm (a real need that fits, but no budget or timeline yet), hot (a clear need that fits, plus at least two of: a stated budget, a stated timeline, a decision maker writing)
- what kind of email is it? new lead, existing client, vendor pitch, spam, job seeker, newsletter or support
- does it need a personal reply from my team? yes or no
- tell Jev in one line what my business does, send the emails in small batches so it stays fast, and give me one spreadsheet with the hot leads at the top
anything Jev is less than 60% sure about goes in a "check these" pile for you to judge. then draft replies for the hot leads only. writing is your job, not Jev's.`;

export const TICKETS = `use Jev to sort my support tickets by urgency and by team. the tickets are in [my export file, or i'll paste them]. ask Jev 3 things about every ticket:
- how soon does it need an answer? today, this week, or no rush
- which team should take it? technical (bugs, outages, errors), billing (charges, refunds, invoices), sales (upgrades, pricing) or success (onboarding, training)
- how likely is this customer to leave? 4 levels: no sign of leaving, mild frustration, openly looking at other options, has set a deadline to leave
- if i have the customer's plan and how long they've been with us, send that along with the ticket. send tickets in small batches so it stays fast, and give me one table sorted by urgency, then by how likely they are to leave
anything Jev is less than 60% sure about gets flagged for a person to read. then write a first reply for the "today" tickets only. writing is your job, not Jev's.`;

export const INVOICES = `use Jev to check my supplier invoices for signs of fraud before anyone pays them. the invoices are in [my folder]. ask Jev 3 things about every invoice:
- how risky does it look? 4 levels: looks normal, one small oddity, several warning signs, strong signs of fraud
- does it combine changed bank details with pressure to pay fast? yes or no
- what should we do with it? pay as normal, hold it and phone the supplier on a number we already know, or reject it
- Jev reads text only, so turn each invoice into plain text first. send it together with what we know about that supplier: their usual bank details, their usual amounts and the date of their last invoice
- Jev is weak at maths and at comparing dates, so you do the sums and the date checks yourself. only ask Jev the judgement calls
give me a table with the riskiest invoices first and one line on why each was flagged. nothing gets paid or rejected on Jev's word alone. it only decides what a person looks at first.`;
