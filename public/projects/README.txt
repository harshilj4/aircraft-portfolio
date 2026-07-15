Project photos live here, one folder per project id (ids from src/data/projects.ts):

  public/projects/pan-tilt-tracker/turret-build-1.jpg
  public/projects/rc-airplane/first-flight.jpg
  ...

Then register each image in src/data/projects.ts, e.g.:

  images: [
    { src: "/projects/pan-tilt-tracker/turret-build-1.jpg",
      alt: "Pan-tilt servo bracket test fit on the breadboard rig" },
  ],

Images appear automatically in that project's exhibit (3D panel, mobile tour and
Recruiter Mode). Use JPG/WebP around 1200-1600px wide for good quality + speed.
