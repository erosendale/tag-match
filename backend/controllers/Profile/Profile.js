'use strict';

const metresToKilometres = 1000;

class Profile {
    constructor(userId, name, dateOfBirth, occupation, bio, photos, tags, location, maxDistance, ageRange) {
        this.userId = userId;
        this.name = name;
        this.dateOfBirth = dateOfBirth;
        this.occupation = occupation;
        this.bio = bio;
        this.photos = photos;
        this.tags = tags;
        this.location = location;
        this.maxDistance = maxDistance;
        this.ageRange = ageRange;
    }

    static fromNeo(neoProfile) {
        const thisProfile = new Profile(
            neoProfile.userId, 
            neoProfile.name, 
            neoProfile.dateOfBirth, 
            neoProfile.occupation, 
            neoProfile.bio, 
            neoProfile.photos,
            neoProfile.tags,
            {
                longitude: neoProfile.location.x,
                latitude: neoProfile.location.y
            },
            neoProfile.maxDistance / metresToKilometres,
            {
                min: neoProfile.ageRangeMin,
                max: neoProfile.ageRangeMax
            }
        );
        return thisProfile;
    }
}

module.exports = Profile;