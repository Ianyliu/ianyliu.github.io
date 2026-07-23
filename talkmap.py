# Leaflet cluster map of talk locations
#
# Run this from the _talks/ directory, which contains .md files of all your
# talks. This scrapes the location YAML field from each .md file, geolocates it
# with geopy/Nominatim, and uses the getorg library to output data, HTML, and
# Javascript for a standalone cluster map. This is functionally the same as the
# #talkmap Jupyter notebook.
import frontmatter
import glob
import getorg
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderServiceError, GeocoderTimedOut

# Set the default timeout, in seconds
TIMEOUT = 5

# Collect the Markdown files
talk_files = sorted(glob.glob("_talks/*.md"))

# Prepare to geolocate
geocoder = Nominatim(user_agent="ianyliu.github.io-talkmap")
location_dict = {}

# Perform geolocation
for file in talk_files:
    # Read the file
    data = frontmatter.load(file)
    data = data.to_dict()

    # Ignore drafts, retained template examples, and entries without locations.
    if data.get("published") is False or not data.get("location"):
        continue

    # Prepare the description
    title = data.get("title", "Untitled talk").strip()
    venue = data.get("venue", "Venue unavailable").strip()
    location = data["location"].strip()
    description = f"{title}<br />{venue}; {location}"

    # Geocode the location and report the status
    try:
        coordinates = geocoder.geocode(location, timeout=TIMEOUT)
        if coordinates is None:
            print(f"Warning: no coordinates found for {location}")
            continue
        location_dict[description] = coordinates
        print(description, coordinates)
    except (GeocoderServiceError, GeocoderTimedOut, ValueError) as error:
        print(f"Warning: geocoding failed for {location}: {error}")

# Save the map
getorg.orgmap.output_html_cluster_map(location_dict, folder_name="talkmap", hashed_usernames=False)
