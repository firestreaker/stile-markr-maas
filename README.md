# stile-markr-maas

# easy setup (docker)
- `docker compose up`
- `curl -i http://localhost:4567`

# setup (local)
- Install [Bun](https://bun.sh/)
- `bun install`
- `bun run migrate:run`
- `bun run serve`

# overview
This POC/solution/MVP uses [Bun](https://bun.sh/) to serve a lightweight web server with the `/import` and `/results/:test-id/aggregate` endpoints over port `4567`. Source code and related tests are store in `/src`, database code is stored in `/db`, and database migration files are stored in `/drizzle`.


# assumptions

 - We will store available marks per result instead of per test as it might be affected by other factors like bonus, scaling, etc and might not be consistent for everyone in the same test
 - On the `/results/:test-id/aggregate endpoint, we want the json returns in number format instead of strings (despite 1 decimal place in the example)
 - We are ok with the application not horizontally scalable due to the local db used, I don't have docker on my local Windows PC to set up another DB container for development

# other notes
 - As I didn't have docker set up on my PC (and had some initial admin installation issues at the start), sqlite was chosen as the db in the interest of time
 - Normally I'm used to development on a mac, but only had windows available this time
 - Some things are a bit barebone (like the manual routing and type coersion/parsing), but I tried to limit this to what I expect to get away with in 2-3 hours
 - We are storing students in a seperate table as I expect this is the kinds of analytics people tend to want in the future, did not do this for tests since there wasn't much info on them but we could do that in the future if that comes up
